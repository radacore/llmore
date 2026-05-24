"""Konfigurasi global aplikasi, di-load dari .env

Validasi nilai dilakukan saat instansiasi `Settings()`. Setting yang invalid
akan di-clamp ke range aman (bukan crash) supaya production resilient.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Tuple

from dotenv import load_dotenv

load_dotenv()

# ---- Helpers ---------------------------------------------------------------


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on", "y"}


def _str(name: str, default: str) -> str:
    return os.getenv(name, default)


_VALID_STRATEGIES = ("least_inflight", "round_robin", "p2c")


# ---- Settings --------------------------------------------------------------


@dataclass
class Settings:
    # ---- Network ----------------------------------------------------------
    host: str = field(default_factory=lambda: _str("HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: _int("PORT", 9898))

    # ---- Logging ----------------------------------------------------------
    log_level: str = field(default_factory=lambda: _str("LOG_LEVEL", "INFO").upper())

    # ---- Alice trial ------------------------------------------------------
    alice_trial_url: str = field(
        default_factory=lambda: _str(
            "ALICE_TRIAL_URL", "https://alice.overment.com/trial/activate"
        )
    )
    alice_trial_code: str = field(default_factory=lambda: _str("ALICE_TRIAL_CODE", "TRIAL"))
    alice_platform: str = field(
        default_factory=lambda: _str("ALICE_PLATFORM", "windows — 10.0.26200")
    )
    alice_version: str = field(default_factory=lambda: _str("ALICE_VERSION", "5.2.1"))

    # ---- OpenRouter -------------------------------------------------------
    openrouter_base: str = field(
        default_factory=lambda: _str("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
    )
    default_model: str = field(
        default_factory=lambda: _str("DEFAULT_MODEL", "anthropic/claude-opus-4")
    )

    # ---- Pool & Concurrency ----------------------------------------------
    pool_size: int = field(default_factory=lambda: _int("POOL_SIZE", 10))
    per_key_concurrency: int = field(default_factory=lambda: _int("PER_KEY_CONCURRENCY", 4))
    load_balance_strategy: str = field(
        default_factory=lambda: _str("LOAD_BALANCE_STRATEGY", "least_inflight").strip().lower()
    )
    acquire_timeout: float = field(default_factory=lambda: _float("ACQUIRE_TIMEOUT", 30.0))
    max_concurrent_requests: int = field(
        default_factory=lambda: _int("MAX_CONCURRENT_REQUESTS", 0)
    )
    agent_affinity: bool = field(default_factory=lambda: _bool("AGENT_AFFINITY", True))

    # ---- Failover --------------------------------------------------------
    max_failover_attempts: int = field(
        default_factory=lambda: _int("MAX_FAILOVER_ATTEMPTS", 5)
    )

    # ---- Token-cap injection ---------------------------------------------
    # Cap max_tokens otomatis berdasarkan sisa kredit key (mencegah error
    # "insufficient credit" mid-stream). 0 = matikan injection sepenuhnya.
    auto_max_tokens_cap: int = field(default_factory=lambda: _int("AUTO_MAX_TOKENS_CAP", 32000))
    # Estimasi konversi credit (USD) → token. Dipakai saat sisa kredit < 0.6.
    credit_to_tokens_ratio: int = field(
        default_factory=lambda: _int("CREDIT_TO_TOKENS_RATIO", 50000)
    )

    # ---- Credit ----------------------------------------------------------
    min_credit_usd: float = field(default_factory=lambda: _float("MIN_CREDIT_USD", 0.10))
    credit_refresh_interval: int = field(
        default_factory=lambda: _int("CREDIT_REFRESH_INTERVAL", 60)
    )

    # ---- Auto credit top-up (VPS mode) -----------------------------------
    # Target total credit pool (USD). Pool akan auto-create akun trial sampai
    # total credit >= target ini saat startup & periodik.
    target_total_credit_usd: float = field(
        default_factory=lambda: _float("TARGET_TOTAL_CREDIT_USD", 500.0)
    )
    # Threshold refill. Kalau total credit pool < threshold ini, auto-create
    # akun baru sampai mencapai target. Harus < target.
    refill_threshold_usd: float = field(
        default_factory=lambda: _float("REFILL_THRESHOLD_USD", 400.0)
    )
    # Concurrency saat bulk-create akun trial (jangan terlalu tinggi: Alice
    # bisa rate-limit / IP-ban).
    trial_create_concurrency: int = field(
        default_factory=lambda: _int("TRIAL_CREATE_CONCURRENCY", 8)
    )
    # Circuit breaker: kalau N aktivasi gagal beruntun, hentikan sementara.
    trial_failure_threshold: int = field(
        default_factory=lambda: _int("TRIAL_FAILURE_THRESHOLD", 10)
    )
    # Durasi cooldown circuit breaker (detik).
    trial_failure_cooldown_s: int = field(
        default_factory=lambda: _int("TRIAL_FAILURE_COOLDOWN_S", 300)
    )
    # Hard ceiling jumlah total key di pool (proteksi kalau credit per trial
    # tiba-tiba kecil dan looping tidak konvergen).
    pool_ceiling: int = field(default_factory=lambda: _int("POOL_CEILING", 1000))

    # ---- HTTP pool -------------------------------------------------------
    http_max_connections: int = field(
        default_factory=lambda: _int("HTTP_MAX_CONNECTIONS", 500)
    )
    http_max_keepalive: int = field(default_factory=lambda: _int("HTTP_MAX_KEEPALIVE", 200))
    http_keepalive_expiry: int = field(
        default_factory=lambda: _int("HTTP_KEEPALIVE_EXPIRY", 60)
    )

    # ---- Auth & storage --------------------------------------------------
    proxy_api_key: str = field(default_factory=lambda: _str("PROXY_API_KEY", ""))
    keys_db_path: str = field(default_factory=lambda: _str("KEYS_DB_PATH", "./data/keys.json"))

    # ---- Validation ------------------------------------------------------
    def __post_init__(self) -> None:
        # Clamp ke range yang masuk akal (jangan crash supaya restart-friendly).
        self.port = max(1, min(65535, self.port))
        self.pool_size = max(1, min(200, self.pool_size))
        self.per_key_concurrency = max(1, min(64, self.per_key_concurrency))
        self.acquire_timeout = max(0.0, min(600.0, self.acquire_timeout))
        self.max_concurrent_requests = max(0, self.max_concurrent_requests)
        self.max_failover_attempts = max(1, min(20, self.max_failover_attempts))
        self.credit_refresh_interval = max(10, self.credit_refresh_interval)
        self.http_max_connections = max(10, self.http_max_connections)
        self.http_max_keepalive = max(1, min(self.http_max_connections, self.http_max_keepalive))
        self.auto_max_tokens_cap = max(0, self.auto_max_tokens_cap)
        self.credit_to_tokens_ratio = max(1000, self.credit_to_tokens_ratio)
        self.min_credit_usd = max(0.0, self.min_credit_usd)

        # Auto top-up clamping
        self.target_total_credit_usd = max(1.0, self.target_total_credit_usd)
        self.refill_threshold_usd = max(0.5, self.refill_threshold_usd)
        # Jamin refill_threshold < target (kalau salah set, default ke 80% target)
        if self.refill_threshold_usd >= self.target_total_credit_usd:
            self.refill_threshold_usd = self.target_total_credit_usd * 0.8
        self.trial_create_concurrency = max(1, min(32, self.trial_create_concurrency))
        self.trial_failure_threshold = max(1, self.trial_failure_threshold)
        self.trial_failure_cooldown_s = max(10, self.trial_failure_cooldown_s)
        self.pool_ceiling = max(self.pool_size, min(5000, self.pool_ceiling))

        if self.load_balance_strategy not in _VALID_STRATEGIES:
            self.load_balance_strategy = "least_inflight"

        # Buang trailing slash di base url
        self.openrouter_base = self.openrouter_base.rstrip("/")

    # ---- Computed --------------------------------------------------------
    def effective_max_concurrent(self) -> int:
        """Hard cap total request bersamaan di proxy."""
        if self.max_concurrent_requests > 0:
            return self.max_concurrent_requests
        # Auto: pool_size * per_key_concurrency * 1.5
        return max(1, int(self.pool_size * self.per_key_concurrency * 1.5))

    def safe_max_tokens(self, credit_remaining: float | None) -> int:
        """Hitung cap max_tokens berdasarkan sisa kredit. 0 → no cap."""
        cap = self.auto_max_tokens_cap
        if cap <= 0:
            return 0  # disabled
        if credit_remaining is None or credit_remaining >= 0.6:
            return cap
        # Sisa kredit kecil → kurangi cap proporsional
        scaled = int(credit_remaining * self.credit_to_tokens_ratio)
        return max(500, min(cap, scaled))

    def proxy_auth_required(self) -> bool:
        return bool(self.proxy_api_key)


settings = Settings()
