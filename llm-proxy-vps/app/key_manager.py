"""Pool manager untuk OpenRouter API keys.

Fitur:
- Pool keys dengan tracking: credit, usage count, in-flight, status, last_error.
- Strategi pemilihan key: least_inflight (default) | round_robin | p2c.
- Acquire dengan wait queue (anti-thundering-herd) saat semua key penuh.
- Agent affinity: request dari sub-agent yang sama coba di-route ke key yang sama
  selama key tersebut masih sehat & punya slot — bagus untuk prompt caching.
- Auto top-up: kalau jumlah key sehat < pool_size, panggil trial_activator.
- Refresh credit periodik via background task.
- Persistensi ke JSON.
"""
from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass, field, asdict
from typing import Optional

from .config import settings
from .storage import JsonStore
from .credit_checker import fetch_credit
from .trial_activator import activate_trial
from .http_clients import meta_client
from .logging_setup import get_logger, mask_key


log = get_logger("key_manager")


@dataclass
class ApiKey:
    key: str
    license_key: str = ""
    email: str = ""
    created_at: float = field(default_factory=time.time)
    expires_at: str = ""

    # State
    enabled: bool = True
    in_flight: int = 0
    total_requests: int = 0
    total_errors: int = 0
    last_error: str = ""
    last_used: float = 0.0

    # Credit info (di-refresh periodik)
    credit_limit: Optional[float] = None
    credit_usage: float = 0.0
    credit_remaining: Optional[float] = None
    credit_checked_at: float = 0.0

    def to_public(self) -> dict:
        return {
            "key_preview": self.key[:14] + "..." + self.key[-6:],
            "email": self.email,
            "enabled": self.enabled,
            "in_flight": self.in_flight,
            "total_requests": self.total_requests,
            "total_errors": self.total_errors,
            "last_error": self.last_error[:120],
            "credit_limit": self.credit_limit,
            "credit_usage": round(self.credit_usage, 4),
            "credit_remaining": (
                round(self.credit_remaining, 4)
                if self.credit_remaining is not None
                else None
            ),
            "credit_checked_at": self.credit_checked_at,
            "expires_at": self.expires_at,
        }

    def is_healthy(self) -> bool:
        if not self.enabled:
            return False
        # Pakai threshold MIN_CREDIT_USD dari settings, bukan 0.0 hardcoded.
        # Key dengan saldo di bawah threshold (mis. < $0.05) hampir pasti
        # akan kena 402 dari OpenRouter → mark unhealthy lebih awal supaya
        # request tidak pernah di-route ke key tsb.
        if self.credit_remaining is not None:
            if self.credit_remaining <= settings.min_credit_usd:
                return False
        return True


class KeyManager:
    def __init__(self):
        self.store = JsonStore(settings.keys_db_path)
        self.keys: list[ApiKey] = []
        self._rr_index = 0
        self._lock = asyncio.Lock()
        self._refresh_task: Optional[asyncio.Task] = None
        self._stopping = False

        # Anti-thundering-herd: notifikasi saat ada slot key yang baru bebas.
        # Pakai Event dan re-set tiap acquire — model "broadcast then resubscribe".
        self._slot_event = asyncio.Event()

        # Global concurrency limiter (across all keys). Lazy init di start().
        self._global_sem: Optional[asyncio.Semaphore] = None
        # Track berapa slot yang sedang dipakai (public counter, bukan _value).
        self._global_in_use: int = 0
        self._global_cap: int = 0

        # Agent affinity: agent_id -> last_used_key (string)
        self._affinity: dict[str, str] = {}

        # Circuit breaker untuk auto trial creation.
        # Counter aktivasi gagal beruntun; reset tiap sukses.
        self._trial_consecutive_failures: int = 0
        # Monotonic timestamp sampai kapan pause aktivasi. 0 = tidak pause.
        self._trial_cooldown_until: float = 0.0
        # Lock dedicated supaya ensure_credit_target tidak race dengan dirinya
        # sendiri (re-entrancy dari refresh_loop + bootstrap).
        self._topup_lock = asyncio.Lock()

    # ---- Lifecycle -------------------------------------------------------

    async def start(self) -> None:
        cap = max(1, settings.effective_max_concurrent())
        self._global_cap = cap
        self._global_sem = asyncio.Semaphore(cap)
        await self._load()
        await self.refresh_all_credits()

        # Auto top-up dijalankan di background supaya startup tidak blok.
        # Aktivasi N akun trial bisa makan puluhan detik; lifespan harus
        # selesai cepat agar /healthz dan /readyz responsif.
        asyncio.create_task(self._bootstrap_credit_target())

        self._refresh_task = asyncio.create_task(self._refresh_loop())
        log.info(
            "KeyManager started: pool_floor=%d target=$%.0f threshold=$%.0f global_cap=%d",
            settings.pool_size, settings.target_total_credit_usd,
            settings.refill_threshold_usd, cap,
        )

    async def _bootstrap_credit_target(self) -> None:
        """Background bootstrap: top-up credit pool sampai target.

        Pertama tetap pastikan minimum `pool_size` key sehat (kompat lama),
        baru kemudian `ensure_credit_target` untuk refill ke target USD.
        """
        try:
            await self.ensure_pool()
            await self.ensure_credit_target()
        except Exception as e:  # noqa: BLE001
            log.error("bootstrap credit target gagal: %s", e)

    async def stop(self) -> None:
        self._stopping = True
        if self._refresh_task:
            self._refresh_task.cancel()
            try:
                await self._refresh_task
            except asyncio.CancelledError:
                pass
        await self._save()
        log.info("KeyManager stopped.")

    # ---- Persistence -----------------------------------------------------

    async def _load(self) -> None:
        data = await self.store.load()
        self.keys = [ApiKey(**k) for k in data.get("keys", [])]
        log.info("Loaded %d key(s) from storage.", len(self.keys))

    async def _save(self) -> None:
        await self.store.save({"keys": [asdict(k) for k in self.keys]})

    # ---- Pool management -------------------------------------------------

    def _healthy_keys(self) -> list[ApiKey]:
        return [k for k in self.keys if k.is_healthy()]

    async def ensure_pool(self) -> dict:
        """Pastikan jumlah key sehat == pool_size. Buat baru jika kurang."""
        async with self._lock:
            healthy = len(self._healthy_keys())
            need = max(0, settings.pool_size - healthy)
        created = []
        if need > 0:
            log.info("ensure_pool: healthy=%d target=%d, creating %d new key(s)", healthy, settings.pool_size, need)
            created = await self._create_keys(need)
        # Notify waiters: ada (mungkin) slot baru
        self._wake_waiters()
        return {"healthy_before": healthy, "created": len(created)}

    def _trial_circuit_open(self) -> bool:
        """True kalau circuit breaker sedang open (pause aktivasi)."""
        return time.monotonic() < self._trial_cooldown_until

    def _trial_circuit_remaining(self) -> int:
        return max(0, int(self._trial_cooldown_until - time.monotonic()))

    async def _create_keys(self, n: int) -> list[ApiKey]:
        """Buat n key baru via trial activation, paralel.

        Honor circuit breaker: kalau open, return [] tanpa coba aktivasi.
        Setiap kegagalan increment counter; threshold tercapai -> set cooldown.
        Setiap sukses reset counter.
        """
        if n <= 0:
            return []
        if self._trial_circuit_open():
            log.warning(
                "trial circuit OPEN (cooldown %ds left); skipping create of %d key(s)",
                self._trial_circuit_remaining(), n,
            )
            return []

        sem = asyncio.Semaphore(settings.trial_create_concurrency)
        new_keys: list[ApiKey] = []
        # Local counter dalam batch ini supaya gather tidak interleaving aneh.
        local_failures = 0
        local_successes = 0
        fail_lock = asyncio.Lock()

        async def _one():
            nonlocal local_failures, local_successes
            async with sem:
                # Re-check circuit di tengah batch besar (kalau threshold tercapai
                # selama batch, hentikan sisa percobaan).
                if self._trial_circuit_open():
                    return
                try:
                    data = await activate_trial()
                    api_key = data.get("trialApiKey")
                    if not api_key:
                        async with fail_lock:
                            local_failures += 1
                            self._trial_consecutive_failures += 1
                            self._maybe_open_circuit()
                        return
                    k = ApiKey(
                        key=api_key,
                        license_key=data.get("licenseKey", ""),
                        email=data.get("_email", ""),
                        expires_at=data.get("expiresAt", ""),
                    )
                    new_keys.append(k)
                    async with fail_lock:
                        local_successes += 1
                        self._trial_consecutive_failures = 0
                except Exception as e:  # noqa: BLE001
                    log.warning("gagal create trial: %s", e)
                    async with fail_lock:
                        local_failures += 1
                        self._trial_consecutive_failures += 1
                        self._maybe_open_circuit()

        await asyncio.gather(*[_one() for _ in range(n)])

        if new_keys:
            async with self._lock:
                self.keys.extend(new_keys)
            await self._save()
            await asyncio.gather(*[self._refresh_one(k) for k in new_keys])

        log.info(
            "trial batch: requested=%d created=%d failed=%d consec_failures=%d",
            n, local_successes, local_failures, self._trial_consecutive_failures,
        )
        return new_keys

    def _maybe_open_circuit(self) -> None:
        """Buka circuit breaker kalau counter beruntun >= threshold."""
        if self._trial_consecutive_failures >= settings.trial_failure_threshold:
            self._trial_cooldown_until = (
                time.monotonic() + settings.trial_failure_cooldown_s
            )
            log.error(
                "TRIAL CIRCUIT OPEN: %d failures beruntun. Cooldown %ds. "
                "Cek koneksi ke alice.overment.com atau IP rate-limit.",
                self._trial_consecutive_failures,
                settings.trial_failure_cooldown_s,
            )
            self._trial_consecutive_failures = 0

    async def add_keys(self, n: int) -> list[ApiKey]:
        """Tambah n key baru ke pool (dipanggil dari dashboard)."""
        return await self._create_keys(n)

    async def remove_key(self, key_preview_or_full: str) -> bool:
        async with self._lock:
            before = len(self.keys)
            self.keys = [
                k for k in self.keys
                if k.key != key_preview_or_full
                and not k.key.startswith(key_preview_or_full[:14])
            ]
            removed = before - len(self.keys)
        if removed:
            await self._save()
            log.info("Removed %d key(s) matching '%s'", removed, key_preview_or_full[:14])
        return removed > 0

    # ---- Credit refresh --------------------------------------------------

    async def _refresh_one(self, k: ApiKey) -> None:
        info = await fetch_credit(k.key, meta_client())
        if "error" in info:
            k.last_error = info["error"]
            # Hanya disable kalau 401 (key invalid/revoked).
            # 403 dari /auth/key = "management key" error, key masih bisa dipakai.
            if "401" in info["error"]:
                k.enabled = False
                log.warning("Key %s disabled (401): %s", mask_key(k.key), info["error"])
        else:
            k.credit_limit = info.get("limit")
            k.credit_usage = info.get("usage", 0) or 0
            k.credit_remaining = info.get("remaining")
            k.credit_checked_at = time.time()

    async def refresh_all_credits(self) -> None:
        if not self.keys:
            return
        await asyncio.gather(*[self._refresh_one(k) for k in self.keys])

        threshold = settings.min_credit_usd
        dead_keys = [
            k for k in self.keys
            if not k.enabled
            or (k.credit_remaining is not None and k.credit_remaining <= threshold)
        ]
        if dead_keys:
            async with self._lock:
                for dk in dead_keys:
                    if dk in self.keys:
                        self.keys.remove(dk)
            log.info(
                "Auto-deleted %d exhausted/invalid key(s) (threshold=$%.2f).",
                len(dead_keys), threshold,
            )

        await self._save()

    # ---- Credit target (auto top-up) -------------------------------------

    def _total_credit_remaining(self) -> float:
        total = 0.0
        for k in self.keys:
            if k.is_healthy() and k.credit_remaining is not None:
                total += k.credit_remaining
        return total

    async def ensure_credit_target(self) -> dict:
        """Pastikan total credit pool >= target.

        Algoritma:
        1. Refresh credit semua key + buang yang habis.
        2. Hitung total credit pool yang sehat.
        3. Kalau total >= refill_threshold -> no-op.
        4. Kalau < threshold -> create akun trial baru sampai total >= target.
           - Estimasi key dibutuhkan: ceil((target - total) / avg_per_key).
           - Cap dengan pool_ceiling (proteksi infinite loop).
           - Honor circuit breaker.
        5. Re-refresh credit key baru untuk update angka total.

        Idempotent + serial: lock `_topup_lock` mencegah race antara
        bootstrap dan refresh loop yang trigger bersamaan.
        """
        async with self._topup_lock:
            await self.refresh_all_credits()
            total = self._total_credit_remaining()
            target = settings.target_total_credit_usd
            threshold = settings.refill_threshold_usd

            if total >= threshold:
                return {
                    "topped_up": False,
                    "total_before": round(total, 2),
                    "total_after": round(total, 2),
                    "target": target,
                    "threshold": threshold,
                    "created": 0,
                }

            if self._trial_circuit_open():
                log.warning(
                    "ensure_credit_target: total=$%.2f < threshold=$%.2f tapi "
                    "circuit breaker OPEN (cooldown %ds). Skip top-up.",
                    total, threshold, self._trial_circuit_remaining(),
                )
                return {
                    "topped_up": False,
                    "circuit_open": True,
                    "cooldown_remaining_s": self._trial_circuit_remaining(),
                    "total_before": round(total, 2),
                    "total_after": round(total, 2),
                    "target": target,
                    "threshold": threshold,
                    "created": 0,
                }

            need_usd = target - total
            healthy_with_credit = [
                k for k in self.keys
                if k.is_healthy() and k.credit_remaining is not None
            ]
            if healthy_with_credit:
                avg_per_key = max(
                    0.5,
                    sum(float(k.credit_remaining or 0.0) for k in healthy_with_credit)
                    / len(healthy_with_credit),
                )
            else:
                avg_per_key = 1.0

            import math
            n_keys_wanted = math.ceil(need_usd / avg_per_key)
            current_total_keys = len(self.keys)
            room_left = max(0, settings.pool_ceiling - current_total_keys)
            n_keys = max(0, min(n_keys_wanted, room_left))

            log.info(
                "ensure_credit_target: total=$%.2f < threshold=$%.2f, "
                "need=$%.2f, avg_per_key=$%.2f -> create %d key(s) "
                "(want=%d, ceiling_room=%d)",
                total, threshold, need_usd, avg_per_key,
                n_keys, n_keys_wanted, room_left,
            )

            created: list[ApiKey] = []
            if n_keys > 0:
                created = await self._create_keys(n_keys)

            self._wake_waiters()

            total_after = self._total_credit_remaining()
            log.info(
                "ensure_credit_target done: created=%d total $%.2f -> $%.2f (target=$%.2f)",
                len(created), total, total_after, target,
            )
            return {
                "topped_up": True,
                "total_before": round(total, 2),
                "total_after": round(total_after, 2),
                "target": target,
                "threshold": threshold,
                "created": len(created),
                "requested": n_keys,
                "ceiling_room": room_left,
            }

    async def _refresh_loop(self) -> None:
        while not self._stopping:
            try:
                await asyncio.sleep(settings.credit_refresh_interval)
                await self.ensure_credit_target()
            except asyncio.CancelledError:
                break
            except Exception as e:  # noqa: BLE001
                log.error("refresh loop error: %s", e)

    # ---- Selection strategies (held under self._lock) -------------------

    def _pick_least_inflight(self) -> Optional[ApiKey]:
        """Cari key healthy dgn in_flight terkecil & < per_key_concurrency.
        Tie-break: total_requests lebih kecil → fairness antar key.
        """
        cap = settings.per_key_concurrency
        best: Optional[ApiKey] = None
        for k in self.keys:
            if not k.is_healthy() or k.in_flight >= cap:
                continue
            if best is None:
                best = k
                continue
            if k.in_flight < best.in_flight:
                best = k
            elif k.in_flight == best.in_flight and k.total_requests < best.total_requests:
                best = k
        return best

    def _pick_p2c(self) -> Optional[ApiKey]:
        """Power-of-two-choices: random 2, pilih yg in_flight lebih kecil.
        O(1) — bagus untuk pool besar.
        """
        cap = settings.per_key_concurrency
        eligible = [k for k in self.keys if k.is_healthy() and k.in_flight < cap]
        if not eligible:
            return None
        if len(eligible) == 1:
            return eligible[0]
        a, b = random.sample(eligible, 2)
        return a if a.in_flight <= b.in_flight else b

    def _pick_round_robin(self) -> Optional[ApiKey]:
        """Round-robin klasik (perilaku lama)."""
        n = len(self.keys)
        if n == 0:
            return None
        cap = settings.per_key_concurrency
        for _ in range(n * 2):
            self._rr_index = (self._rr_index + 1) % n
            k = self.keys[self._rr_index]
            if k.is_healthy() and k.in_flight < cap:
                return k
        return None

    def _pick_affinity(self, agent_id: str) -> Optional[ApiKey]:
        """Coba pakai key yang sama untuk agent_id ini (kalau masih ada slot)."""
        last_key = self._affinity.get(agent_id)
        if not last_key:
            return None
        cap = settings.per_key_concurrency
        for k in self.keys:
            if k.key == last_key and k.is_healthy() and k.in_flight < cap:
                return k
        return None

    def _pick(self, agent_id: Optional[str] = None) -> Optional[ApiKey]:
        """Single dispatch berdasarkan strategy + affinity opsional."""
        if agent_id and settings.agent_affinity:
            k = self._pick_affinity(agent_id)
            if k is not None:
                return k

        strategy = settings.load_balance_strategy
        if strategy == "round_robin":
            return self._pick_round_robin()
        if strategy == "p2c":
            return self._pick_p2c()
        # default
        return self._pick_least_inflight()

    def _wake_waiters(self) -> None:
        """Beritahu semua waiter di acquire() bahwa state mungkin berubah."""
        if not self._slot_event.is_set():
            self._slot_event.set()

    # ---- Acquire / Release for proxying ---------------------------------

    async def _ensure_global_sem(self) -> asyncio.Semaphore:
        if self._global_sem is None:
            cap = max(1, settings.effective_max_concurrent())
            self._global_cap = cap
            self._global_sem = asyncio.Semaphore(cap)
        return self._global_sem

    async def acquire(self, agent_id: Optional[str] = None) -> Optional[ApiKey]:
        """Pilih key paling sehat untuk dipakai.

        - Pakai strategy dari settings (least_inflight default).
        - Honor agent_id untuk affinity (kalau aktif).
        - Wait sampai ada slot kosong (max ACQUIRE_TIMEOUT detik) kalau semua penuh.
        - Return None kalau timeout / pool benar-benar kosong.

        IMPORTANT: caller WAJIB panggil release() (sukses ATAU error) supaya
        in_flight ter-decrement & global semaphore di-release.
        """
        sem = await self._ensure_global_sem()

        timeout = max(0.0, settings.acquire_timeout)
        deadline = time.monotonic() + timeout if timeout > 0 else None

        # Step 1: ambil global slot. Public API only.
        try:
            if timeout > 0:
                await asyncio.wait_for(sem.acquire(), timeout=timeout)
            else:
                # Non-blocking: kalau sem.locked() berarti tidak ada slot bebas.
                if sem.locked():
                    return None
                await sem.acquire()
        except asyncio.TimeoutError:
            return None

        # Tandai global slot sebagai dipakai
        self._global_in_use += 1
        global_released = False

        try:
            # Step 2: cari key. Kalau tidak ada slot per-key, tunggu sampai ada
            # release() yang nge-set slot_event.
            while True:
                async with self._lock:
                    if not self.keys:
                        # Pool benar-benar kosong; release global slot
                        sem.release()
                        self._global_in_use = max(0, self._global_in_use - 1)
                        global_released = True
                        return None

                    k = self._pick(agent_id)
                    if k is not None:
                        k.in_flight += 1
                        k.total_requests += 1
                        k.last_used = time.time()
                        if agent_id and settings.agent_affinity:
                            self._affinity[agent_id] = k.key
                        # Reset event setelah ada acquire sukses sehingga
                        # waiter berikutnya akan menunggu release berikutnya.
                        if self._slot_event.is_set():
                            self._slot_event.clear()
                        return k

                    # Semua key healthy penuh. Reset event, lalu wait di luar lock.
                    if self._slot_event.is_set():
                        self._slot_event.clear()

                # Wait dengan sisa deadline
                if deadline is not None:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        sem.release()
                        self._global_in_use = max(0, self._global_in_use - 1)
                        global_released = True
                        return None
                else:
                    remaining = None

                try:
                    if remaining is None:
                        await self._slot_event.wait()
                    else:
                        await asyncio.wait_for(self._slot_event.wait(), timeout=remaining)
                except asyncio.TimeoutError:
                    sem.release()
                    self._global_in_use = max(0, self._global_in_use - 1)
                    global_released = True
                    return None
        except BaseException:
            # Hindari leak global slot kalau ada cancellation/error.
            if not global_released:
                try:
                    sem.release()
                    self._global_in_use = max(0, self._global_in_use - 1)
                except ValueError:
                    pass
            raise

    async def release(self, k: ApiKey, error: Optional[str] = None) -> None:
        async with self._lock:
            k.in_flight = max(0, k.in_flight - 1)
            if error:
                k.total_errors += 1
                k.last_error = error
            else:
                k.last_error = ""
        # Release global slot & wake up waiter
        if self._global_sem is not None:
            try:
                self._global_sem.release()
                self._global_in_use = max(0, self._global_in_use - 1)
            except ValueError:
                pass
        self._wake_waiters()

    def snapshot(self) -> list[dict]:
        return [k.to_public() for k in self.keys]

    def stats(self) -> dict:
        healthy = self._healthy_keys()
        total_remaining = sum(
            (k.credit_remaining or 0) for k in healthy
        )
        in_flights = [k.in_flight for k in self.keys]
        cap = settings.per_key_concurrency
        global_capacity = len(healthy) * cap
        global_in_flight = sum(in_flights)
        return {
            "pool_size_target": settings.pool_size,
            "total_keys": len(self.keys),
            "healthy_keys": len(healthy),
            "total_in_flight": global_in_flight,
            "total_requests": sum(k.total_requests for k in self.keys),
            "total_errors": sum(k.total_errors for k in self.keys),
            "total_credit_remaining_usd": round(total_remaining, 4),
            # Multi-agent metrics
            "per_key_concurrency": cap,
            "global_capacity": global_capacity,
            "global_utilization_pct": (
                round(100.0 * global_in_flight / global_capacity, 1)
                if global_capacity > 0 else 0.0
            ),
            "max_in_flight_on_one_key": max(in_flights) if in_flights else 0,
            "load_balance_strategy": settings.load_balance_strategy,
            "max_concurrent_requests": settings.effective_max_concurrent(),
            "global_slots_in_use": self._global_in_use,
            "global_slots_cap": self._global_cap or settings.effective_max_concurrent(),
            "target_total_credit_usd": settings.target_total_credit_usd,
            "refill_threshold_usd": settings.refill_threshold_usd,
            "credit_progress_pct": (
                round(100.0 * total_remaining / settings.target_total_credit_usd, 1)
                if settings.target_total_credit_usd > 0 else 0.0
            ),
            "trial_circuit_open": self._trial_circuit_open(),
            "trial_cooldown_remaining_s": self._trial_circuit_remaining(),
            "trial_consecutive_failures": self._trial_consecutive_failures,
            "pool_ceiling": settings.pool_ceiling,
        }


# Singleton
key_manager = KeyManager()
