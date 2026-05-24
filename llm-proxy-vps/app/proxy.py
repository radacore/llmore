"""LLM Proxy - meneruskan request OpenAI-compatible ke OpenRouter.

Optimasi kecepatan & robustness:
- Pakai shared httpx.AsyncClient (HTTP/2 + pool besar) dari `app.http_clients`.
- Body di-parse SEKALI di awal (untuk decide stream + injeksi max_tokens),
  lalu dipakai ulang setiap attempt failover (re-encode hanya kalau dimodifikasi).
- Streaming dilakukan via async iterator (tanpa buffer penuh).
- Failover otomatis ke key lain jika 401/402/429/5xx.
- in_flight dijamin TIDAK leak walau client disconnect mid-stream
  (release dipanggil di finally generator).
- Logging via logging_setup; key selalu di-mask.
"""
from __future__ import annotations

import json
from typing import Any, AsyncIterator, Optional

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from .config import settings
from .key_manager import key_manager, ApiKey
from .http_clients import forward_client
from .logging_setup import get_logger, mask_key


log = get_logger("proxy")

# Status code yang trigger failover ke key lain
_FAILOVER_CODES = {401, 402, 403, 429, 500, 502, 503, 504}
# Status code yang menandakan key invalid/exhausted → instan auto-delete
_DELETE_KEY_CODES = {401, 402}
# Status code yang JANGAN PERNAH di-bocor ke client; proxy WAJIB exhaust
# semua opsi (delete key + ensure_pool + retry) sebelum menyerah.
# 402 = trial habis → user mengharapkan transparent rotation.
_NEVER_LEAK_CODES = {401, 402}

# Header yang dipakai client (mis. OpenCode) untuk menandai sub-agent.
# Salah satu match cukup; urutan = prioritas.
_AGENT_HEADER_CANDIDATES = (
    "x-agent-id",
    "x-subagent-id",
    "x-opencode-agent",
    "x-task-id",
    "x-session-id",
)

_PASSTHROUGH_HEADERS = {"content-type", "cache-control"}


def _extract_agent_id(request: Request) -> Optional[str]:
    """Cari header 'X-Agent-ID' / 'X-Subagent-ID' dll dari client.
    Return None kalau tidak ada — proxy fallback ke load-balancing biasa.
    """
    for name in _AGENT_HEADER_CANDIDATES:
        val = request.headers.get(name)
        if val:
            return val.strip()[:128]  # cap panjang biar aman
    return None


async def close_client() -> None:
    """Backward-compat: tutup forward client (dipanggil di lifespan)."""
    # Implementasi sebenarnya ada di http_clients.aclose_all().
    # Fungsi ini disimpan supaya import lama tidak break.
    return


def _build_headers(api_key: ApiKey, incoming: dict) -> dict:
    return {
        "Authorization": f"Bearer {api_key.key}",
        "Content-Type": "application/json",
        "HTTP-Referer": incoming.get("referer", "https://localhost"),
        "X-Title": incoming.get("title", "LLM-Proxy-Router"),
    }


def _encode_body(parsed: Optional[dict[str, Any]], original: bytes) -> bytes:
    """Re-encode parsed body kalau ada modifikasi, else pakai original."""
    if parsed is None:
        return original
    return json.dumps(parsed, ensure_ascii=False).encode("utf-8")


def _apply_token_cap(parsed: dict[str, Any], api_key: ApiKey) -> bool:
    """Inject / cap max_tokens berdasarkan sisa kredit. Return True kalau dimodifikasi."""
    safe_max = settings.safe_max_tokens(api_key.credit_remaining)
    if safe_max <= 0:
        return False  # token-cap injection disabled

    modified = False
    has_any_max = "max_tokens" in parsed or "max_completion_tokens" in parsed
    if not has_any_max:
        log.debug(
            "inject max_tokens=%d key=%s balance=%s",
            safe_max, mask_key(api_key.key), api_key.credit_remaining,
        )
        parsed["max_tokens"] = safe_max
        modified = True
    else:
        for fld in ("max_tokens", "max_completion_tokens"):
            val = parsed.get(fld)
            try:
                ival = int(val) if val is not None else None
            except (TypeError, ValueError):
                ival = None
            if ival is not None and ival > safe_max:
                log.debug(
                    "cap %s: %d -> %d key=%s balance=%s",
                    fld, ival, safe_max, mask_key(api_key.key), api_key.credit_remaining,
                )
                parsed[fld] = safe_max
                modified = True
    return modified


async def _acquire_with_topup(agent_id: Optional[str]) -> Optional[ApiKey]:
    """Acquire key; kalau gagal coba ensure_pool sampai 2x lalu retry.

    Pertama acquire normal. Kalau None → ensure_pool (bikin trial baru) → retry.
    Kalau masih None → refresh credit semua key (mungkin ada yang baru top-up
    di OpenRouter side) → retry sekali lagi. Total max 3 percobaan acquire.
    """
    api_key = await key_manager.acquire(agent_id=agent_id)
    if api_key is not None:
        return api_key

    # Try 1: top-up pool (bikin trial baru kalau perlu)
    await key_manager.ensure_pool()
    api_key = await key_manager.acquire(agent_id=agent_id)
    if api_key is not None:
        return api_key

    # Try 2: refresh credit (mungkin ada key yang sebelumnya dianggap habis
    # ternyata dapat top-up sisi OpenRouter) + ensure_pool sekali lagi.
    try:
        await key_manager.refresh_all_credits()
    except Exception as e:  # noqa: BLE001
        log.warning("refresh_all_credits gagal saat top-up: %s", e)
    await key_manager.ensure_pool()
    return await key_manager.acquire(agent_id=agent_id)


async def _handle_failover_response(
    api_key: ApiKey,
    status_code: int,
    body_preview: str,
) -> None:
    """Tangani respons error: auto-delete key kalau perlu, lalu release."""
    if status_code in _DELETE_KEY_CODES:
        log.warning(
            "Key %s mendapat %d, instan auto-delete. body=%s",
            mask_key(api_key.key), status_code, body_preview[:120],
        )
        await key_manager.remove_key(api_key.key)
    await key_manager.release(api_key, error=f"{status_code}: {body_preview[:200]}")


async def forward_chat(
    request: Request, path: str = "/chat/completions"
) -> StreamingResponse | JSONResponse:
    """Forward request ke OpenRouter dengan failover."""
    body = await request.body()

    # Parse SEKALI di awal.
    parsed: Optional[dict[str, Any]] = None
    is_stream = False
    try:
        if body:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                is_stream = bool(parsed.get("stream", False))
            else:
                parsed = None  # bukan dict → biar diteruskan apa adanya
    except json.JSONDecodeError:
        parsed = None

    agent_id = _extract_agent_id(request)
    model_name = parsed.get("model") if isinstance(parsed, dict) else None
    log.info(
        "incoming model=%s stream=%s agent=%s",
        model_name, is_stream, agent_id or "-",
    )

    client = forward_client()
    last_error: dict = {"status": 503, "detail": "no key available"}
    # Minimum attempts = max(setting, pool_size) supaya kita pasti bisa coba
    # SEMUA key di pool dalam skenario massal-exhausted (mis. semua trial habis
    # bersamaan). Cap di 20 supaya tidak runaway.
    base_attempts = max(1, settings.max_failover_attempts)
    pool_attempts = max(1, settings.pool_size)
    max_attempts = min(20, max(base_attempts, pool_attempts + 2))

    saw_402 = False  # track apakah pernah ketemu 402 → kalau iya, jangan bocorkan

    for attempt in range(max_attempts):
        api_key = await _acquire_with_topup(agent_id)
        if api_key is None:
            # Pool kosong total dan tidak bisa top-up. Kalau sebelumnya pernah
            # ketemu 402, naikkan ke 503 (service unavailable) supaya client
            # tidak salah nyangka credit-nya yang habis.
            if saw_402:
                raise HTTPException(
                    503,
                    "Semua API key trial habis dan top-up pool gagal. "
                    "Coba lagi beberapa detik kemudian.",
                )
            raise HTTPException(
                503,
                "Pool penuh / kosong: tidak ada API key tersedia setelah "
                f"timeout {settings.acquire_timeout}s. "
                "Naikkan POOL_SIZE / PER_KEY_CONCURRENCY.",
            )

        # Per-attempt body: copy parsed kalau perlu modifikasi token cap.
        current_body = body
        if isinstance(parsed, dict):
            attempt_parsed = dict(parsed)  # shallow copy, cukup utk top-level
            if _apply_token_cap(attempt_parsed, api_key):
                current_body = _encode_body(attempt_parsed, body)

        headers = _build_headers(api_key, {})

        # ---- Eksekusi request ---------------------------------------------
        try:
            if is_stream:
                response = await _do_stream(
                    client=client,
                    path=path,
                    headers=headers,
                    body=current_body,
                    api_key=api_key,
                )
                if response is _RETRY:
                    # _do_stream sudah handle release/last_error
                    last_error = _last_error_holder["value"]
                    if int(last_error.get("status", 0)) in _NEVER_LEAK_CODES:
                        saw_402 = True
                        log.info(
                            "attempt %d/%d hit %d, rotating to next key",
                            attempt + 1, max_attempts, last_error["status"],
                        )
                    continue
                return response
            else:
                response = await _do_nonstream(
                    client=client,
                    path=path,
                    headers=headers,
                    body=current_body,
                    api_key=api_key,
                )
                if response is _RETRY:
                    last_error = _last_error_holder["value"]
                    if int(last_error.get("status", 0)) in _NEVER_LEAK_CODES:
                        saw_402 = True
                        log.info(
                            "attempt %d/%d hit %d, rotating to next key",
                            attempt + 1, max_attempts, last_error["status"],
                        )
                    continue
                return response
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            log.exception("unexpected error: %s", e)
            await key_manager.release(api_key, error=f"unexpected: {e}")
            last_error = {"status": 500, "detail": str(e)}
            continue

    detail = str(last_error.get("detail", ""))[:300]
    last_status = int(last_error.get("status", 503))
    # Jangan pernah bocorkan 401/402 ke client — itu artinya
    # SEMUA key kita exhausted. Konversikan ke 503 supaya client tahu
    # ini masalah pool sisi proxy, bukan credential client.
    if last_status in _NEVER_LEAK_CODES:
        log.error(
            "ALL keys exhausted (saw %d). Returning 503 ke client. last=%s",
            last_status, detail[:120],
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Semua API key di pool exhausted/invalid setelah "
                f"{max_attempts} attempt. Top-up otomatis sudah dicoba. "
                f"Last upstream: {last_status}. Tunggu beberapa detik & coba lagi."
            ),
        )
    raise HTTPException(
        status_code=last_status,
        detail=f"Semua failover gagal. Last: {detail}",
    )


# Sentinel & holder untuk "retry" path tanpa duplikasi error-handling.
_RETRY = object()
_last_error_holder: dict[str, dict] = {"value": {"status": 503, "detail": "no key"}}


async def _do_nonstream(
    client: httpx.AsyncClient,
    path: str,
    headers: dict,
    body: bytes,
    api_key: ApiKey,
):
    try:
        resp = await client.post(path, headers=headers, content=body)
    except httpx.HTTPError as e:
        await key_manager.release(api_key, error=f"network: {e}")
        _last_error_holder["value"] = {"status": 502, "detail": str(e)}
        return _RETRY

    if resp.status_code in _FAILOVER_CODES:
        await _handle_failover_response(api_key, resp.status_code, resp.text)
        _last_error_holder["value"] = {"status": resp.status_code, "detail": resp.text}
        return _RETRY

    await key_manager.release(api_key)
    ct = resp.headers.get("content-type", "")
    if "application/json" in ct:
        try:
            payload = resp.json()
        except json.JSONDecodeError:
            payload = {"raw": resp.text}
    else:
        payload = {"raw": resp.text}
    return JSONResponse(content=payload, status_code=resp.status_code)


async def _do_stream(
    client: httpx.AsyncClient,
    path: str,
    headers: dict,
    body: bytes,
    api_key: ApiKey,
):
    req = client.build_request("POST", path, headers=headers, content=body)
    try:
        resp = await client.send(req, stream=True)
    except httpx.HTTPError as e:
        await key_manager.release(api_key, error=f"network: {e}")
        _last_error_holder["value"] = {"status": 502, "detail": str(e)}
        return _RETRY

    if resp.status_code in _FAILOVER_CODES:
        try:
            err_body = await resp.aread()
        finally:
            await resp.aclose()
        body_preview = err_body.decode(errors="ignore")
        await _handle_failover_response(api_key, resp.status_code, body_preview)
        _last_error_holder["value"] = {"status": resp.status_code, "detail": body_preview}
        return _RETRY

    # Sukses → stream ke client. Jamin release walau client disconnect.
    async def _gen() -> AsyncIterator[bytes]:
        try:
            async for chunk in resp.aiter_raw():
                yield chunk
        except Exception as e:  # noqa: BLE001
            log.warning("stream interrupted on key=%s: %s", mask_key(api_key.key), e)
            raise
        finally:
            try:
                await resp.aclose()
            finally:
                await key_manager.release(api_key)

    passthrough = {
        k: v for k, v in resp.headers.items()
        if k.lower() in _PASSTHROUGH_HEADERS
    }
    return StreamingResponse(
        _gen(),
        status_code=resp.status_code,
        headers=passthrough,
        media_type=resp.headers.get("content-type", "text/event-stream"),
    )
