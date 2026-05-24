"""FastAPI entrypoint: proxy endpoints + dashboard."""
from __future__ import annotations

import asyncio
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .key_manager import key_manager
from .proxy import forward_chat
from .http_clients import meta_client, aclose_all
from .logging_setup import setup_logging, get_logger


# Init logging sebelum apa pun.
setup_logging(settings.log_level)
log = get_logger("main")


# ---- Models cache --------------------------------------------------------

_models_cache: list[dict] = []
_FALLBACK_FREE_MODEL = "google/gemini-2.0-flash-001"


def _is_free_model(m: dict) -> bool:
    pricing = m.get("pricing", {}) or {}
    try:
        prompt_price = float(pricing.get("prompt", "1") or "1")
        completion_price = float(pricing.get("completion", "1") or "1")
    except (TypeError, ValueError):
        return False
    return prompt_price == 0 and completion_price == 0


async def _fetch_openrouter_models() -> list[dict]:
    """Fetch semua model dari OpenRouter, cache di memory."""
    global _models_cache
    try:
        client = meta_client()
        r = await client.get(f"{settings.openrouter_base}/models")
        r.raise_for_status()
        all_models = r.json().get("data", [])
        _models_cache = all_models
        log.info("Fetched %d model(s) from OpenRouter.", len(all_models))
        return all_models
    except Exception as e:  # noqa: BLE001
        log.warning("models fetch error: %s", e)
        return _models_cache


async def _get_free_models() -> list[dict]:
    """Return hanya model gratis (prompt=0 dan completion=0)."""
    models = _models_cache or await _fetch_openrouter_models()
    return [m for m in models if _is_free_model(m)]


def _pick_free_model_id() -> str:
    """Pilih satu model gratis untuk warm-up test."""
    for m in _models_cache:
        if _is_free_model(m):
            return m.get("id") or _FALLBACK_FREE_MODEL
    return _FALLBACK_FREE_MODEL


# ---- Key warm-up state ---------------------------------------------------

_warmup_results: dict[str, str] = {}  # key_preview -> "ok" | "crash" | "testing"


async def _warmup_key(api_key_str: str, model_id: str) -> str:
    """Test satu API key dengan request minimal ke free model. Return 'ok' atau 'crash'."""
    try:
        client = meta_client()
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 2,
        }
        r = await client.post(
            f"{settings.openrouter_base}/chat/completions",
            headers={"Authorization": f"Bearer {api_key_str}"},
            json=payload,
            timeout=30,
        )
        return "ok" if r.status_code == 200 else "crash"
    except Exception:
        return "crash"


# ---- Lifespan ------------------------------------------------------------

# Inisialisasi default supaya /healthz tetap masuk akal kalau lifespan belum
# jalan (mis. di TestClient tanpa context manager). Akan di-overwrite saat
# startup beneran di lifespan().
_started_at = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _started_at
    _started_at = time.time()
    log.info("Startup: target pool size = %d", settings.pool_size)
    await key_manager.start()
    log.info("Pool ready: %s", key_manager.stats())
    # Fetch models di background
    asyncio.create_task(_fetch_openrouter_models())
    try:
        yield
    finally:
        log.info("Shutdown: stopping key_manager and closing http clients.")
        await key_manager.stop()
        await aclose_all()


app = FastAPI(title="LLM Proxy Router", lifespan=lifespan)


# ---- Request-ID middleware ----------------------------------------------

@app.middleware("http")
async def _request_id_middleware(request: Request, call_next):
    rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    request.state.request_id = rid
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        log.exception("[%s] %s %s failed in %.1fms", rid, request.method, request.url.path, elapsed)
        raise
    elapsed = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = rid
    # Skip noisy logging for /healthz, /readyz, /api/stats poll, /metrics
    path = request.url.path
    if path not in {"/healthz", "/readyz", "/metrics"} and not path.startswith("/static"):
        log.info("[%s] %s %s -> %d in %.1fms", rid, request.method, path, response.status_code, elapsed)
    return response


# ---- Auth dependency (opsional) -----------------------------------------

async def check_auth(request: Request) -> None:
    if not settings.proxy_auth_required():
        return
    auth = request.headers.get("authorization", "")
    expected = f"Bearer {settings.proxy_api_key}"
    # Constant-time compare untuk anti-timing-attack
    if not secrets.compare_digest(auth, expected):
        raise HTTPException(401, "Invalid proxy API key")


# ---- Proxy endpoints (OpenAI-compatible) --------------------------------

@app.post("/v1/chat/completions", dependencies=[Depends(check_auth)])
async def chat_completions(request: Request):
    return await forward_chat(request, "/chat/completions")


@app.post("/v1/completions", dependencies=[Depends(check_auth)])
async def completions(request: Request):
    return await forward_chat(request, "/completions")


@app.get("/v1/models", dependencies=[Depends(check_auth)])
async def models():
    """Return semua model dari OpenRouter (cached)."""
    all_models = _models_cache or await _fetch_openrouter_models()
    return {
        "object": "list",
        "data": [
            {
                "id": m.get("id", ""),
                "object": "model",
                "owned_by": m.get("id", "/").split("/")[0],
            }
            for m in all_models
        ],
    }


# ---- Health & metrics ---------------------------------------------------

@app.get("/healthz")
async def healthz():
    """Liveness — selalu OK kalau proses jalan."""
    return {"status": "ok", "uptime_s": round(time.time() - _started_at, 1)}


@app.get("/readyz")
async def readyz():
    """Readiness — pool punya minimal 1 healthy key."""
    stats = key_manager.stats()
    ready = stats["healthy_keys"] > 0
    payload = {"ready": ready, **stats}
    return JSONResponse(payload, status_code=200 if ready else 503)


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    """Prometheus-compatible plaintext metrics (subset)."""
    s = key_manager.stats()
    lines = [
        "# HELP llmproxy_pool_size_target Target pool size",
        "# TYPE llmproxy_pool_size_target gauge",
        f"llmproxy_pool_size_target {s['pool_size_target']}",
        "# HELP llmproxy_total_keys Total keys in pool",
        "# TYPE llmproxy_total_keys gauge",
        f"llmproxy_total_keys {s['total_keys']}",
        "# HELP llmproxy_healthy_keys Healthy keys in pool",
        "# TYPE llmproxy_healthy_keys gauge",
        f"llmproxy_healthy_keys {s['healthy_keys']}",
        "# HELP llmproxy_in_flight Total requests currently in flight",
        "# TYPE llmproxy_in_flight gauge",
        f"llmproxy_in_flight {s['total_in_flight']}",
        "# HELP llmproxy_global_capacity Healthy keys * per_key_concurrency",
        "# TYPE llmproxy_global_capacity gauge",
        f"llmproxy_global_capacity {s['global_capacity']}",
        "# HELP llmproxy_global_utilization_pct Percent capacity in use",
        "# TYPE llmproxy_global_utilization_pct gauge",
        f"llmproxy_global_utilization_pct {s['global_utilization_pct']}",
        "# HELP llmproxy_total_requests Total requests ever served",
        "# TYPE llmproxy_total_requests counter",
        f"llmproxy_total_requests {s['total_requests']}",
        "# HELP llmproxy_total_errors Total errors ever recorded",
        "# TYPE llmproxy_total_errors counter",
        f"llmproxy_total_errors {s['total_errors']}",
        "# HELP llmproxy_credit_remaining_usd Total remaining credit (USD)",
        "# TYPE llmproxy_credit_remaining_usd gauge",
        f"llmproxy_credit_remaining_usd {s['total_credit_remaining_usd']}",
        "# HELP llmproxy_uptime_seconds Process uptime",
        "# TYPE llmproxy_uptime_seconds counter",
        f"llmproxy_uptime_seconds {round(time.time() - _started_at, 1)}",
        "",
    ]
    return "\n".join(lines)


# ---- Management API (untuk dashboard) -----------------------------------

@app.get("/api/stats")
async def api_stats():
    return {
        "stats": key_manager.stats(),
        "keys": key_manager.snapshot(),
        "warmup": _warmup_results,
        "config": {
            "pool_size": settings.pool_size,
            "per_key_concurrency": settings.per_key_concurrency,
            "default_model": settings.default_model,
            "min_credit_usd": settings.min_credit_usd,
            "load_balance_strategy": settings.load_balance_strategy,
            "agent_affinity": settings.agent_affinity,
            "max_concurrent_requests": settings.effective_max_concurrent(),
            "acquire_timeout": settings.acquire_timeout,
            "target_total_credit_usd": settings.target_total_credit_usd,
            "refill_threshold_usd": settings.refill_threshold_usd,
            "pool_ceiling": settings.pool_ceiling,
        },
    }


@app.post("/api/keys/create")
async def api_create_keys(request: Request):
    body = await request.json()
    n = int(body.get("count", 1))
    if n < 1 or n > 50:
        raise HTTPException(400, "count harus 1..50")
    created = await key_manager.add_keys(n)
    return {"requested": n, "created": len(created)}


@app.post("/api/keys/refresh")
async def api_refresh():
    await key_manager.refresh_all_credits()
    return {"ok": True, "stats": key_manager.stats()}


@app.post("/api/keys/ensure")
async def api_ensure():
    res = await key_manager.ensure_pool()
    return {"ok": True, **res, "stats": key_manager.stats()}


@app.post("/api/keys/ensure_credit")
async def api_ensure_credit():
    res = await key_manager.ensure_credit_target()
    return {"ok": True, **res, "stats": key_manager.stats()}


@app.delete("/api/keys/{prefix}")
async def api_remove_key(prefix: str):
    ok = await key_manager.remove_key(prefix)
    return {"removed": ok}


# ---- Settings API (pool_size, dll) --------------------------------------

@app.post("/api/settings")
async def api_update_settings(request: Request):
    body = await request.json()
    if "pool_size" in body:
        val = int(body["pool_size"])
        if val < 1 or val > 100:
            raise HTTPException(400, "pool_size harus 1..100")
        settings.pool_size = val
    if "per_key_concurrency" in body:
        val = int(body["per_key_concurrency"])
        if val < 1 or val > 64:
            raise HTTPException(400, "per_key_concurrency harus 1..64")
        settings.per_key_concurrency = val
    if "load_balance_strategy" in body:
        strat = str(body["load_balance_strategy"]).strip().lower()
        if strat not in ("least_inflight", "round_robin", "p2c"):
            raise HTTPException(400, "load_balance_strategy invalid")
        settings.load_balance_strategy = strat
    if "agent_affinity" in body:
        settings.agent_affinity = bool(body["agent_affinity"])
    return {
        "ok": True,
        "pool_size": settings.pool_size,
        "per_key_concurrency": settings.per_key_concurrency,
        "load_balance_strategy": settings.load_balance_strategy,
        "agent_affinity": settings.agent_affinity,
    }


# ---- Key Warm-Up API -----------------------------------------------------

@app.post("/api/keys/warmup")
async def api_warmup_keys():
    """Warm-up semua keys: test tiap key dengan request ke free model."""
    all_keys = key_manager.keys
    if not all_keys:
        raise HTTPException(503, "Pool kosong, tidak ada key untuk warm-up")

    # Pastikan models cache terisi
    if not _models_cache:
        await _fetch_openrouter_models()

    model_id = _pick_free_model_id()

    # Set semua ke "testing"
    for k in all_keys:
        _warmup_results[k.key[:14]] = "testing"

    sem = asyncio.Semaphore(5)

    async def _test(k):
        async with sem:
            result = await _warmup_key(k.key, model_id)
            _warmup_results[k.key[:14]] = result

    await asyncio.gather(*[_test(k) for k in all_keys])

    ok_count = sum(1 for v in _warmup_results.values() if v == "ok")
    crash_count = sum(1 for v in _warmup_results.values() if v == "crash")
    return {"ok": True, "tested": len(all_keys), "ok_count": ok_count, "crash_count": crash_count}


# ---- Models API (free models list) --------------------------------------

@app.get("/api/models/free")
async def api_free_models():
    free = await _get_free_models()
    return {
        "models": [
            {
                "id": m.get("id", ""),
                "name": m.get("name", m.get("id", "")),
                "context_length": m.get("context_length"),
            }
            for m in free
        ],
        "total": len(free),
    }


@app.post("/api/models/refresh")
async def api_refresh_models():
    await _fetch_openrouter_models()
    free = await _get_free_models()
    return {"ok": True, "total_all": len(_models_cache), "total_free": len(free)}


# ---- Dashboard ----------------------------------------------------------

_DASHBOARD_PATH = Path(__file__).parent / "templates" / "dashboard.html"
_DASHBOARD_HTML = (
    _DASHBOARD_PATH.read_text(encoding="utf-8") if _DASHBOARD_PATH.exists() else ""
)


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    if not _DASHBOARD_HTML:
        return HTMLResponse("<h1>Dashboard template tidak ditemukan</h1>", 500)
    return HTMLResponse(_DASHBOARD_HTML)


# Static (kalau perlu)
_static_dir = Path(__file__).parent / "static"
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")
