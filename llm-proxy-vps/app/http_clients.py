"""Shared httpx clients.

Dua client dipisah by purpose:

1. `forward_client()`  — untuk meneruskan request user ke OpenRouter.
   Pool besar (settings.http_max_*), HTTP/2, timeout panjang untuk stream.

2. `meta_client()`     — untuk request meta (cek credit, list model, warm-up).
   Pool kecil, timeout pendek. Dipisah supaya request meta tidak makan slot
   pool yang dipakai forward_chat() dan sebaliknya tidak antri di belakang
   stream-stream besar.

Kedua client di-init lazy, di-share single-instance per module, dan ditutup
oleh `aclose_all()` saat shutdown.
"""
from __future__ import annotations

import asyncio
from typing import Optional

import httpx

from .config import settings

_forward: Optional[httpx.AsyncClient] = None
_meta: Optional[httpx.AsyncClient] = None
_lock = asyncio.Lock()


def _build_forward() -> httpx.AsyncClient:
    limits = httpx.Limits(
        max_keepalive_connections=settings.http_max_keepalive,
        max_connections=settings.http_max_connections,
        keepalive_expiry=settings.http_keepalive_expiry,
    )
    return httpx.AsyncClient(
        base_url=settings.openrouter_base,
        http2=True,
        limits=limits,
        timeout=httpx.Timeout(connect=10, read=600, write=60, pool=10),
    )


def _build_meta() -> httpx.AsyncClient:
    limits = httpx.Limits(
        max_keepalive_connections=20,
        max_connections=50,
        keepalive_expiry=30,
    )
    return httpx.AsyncClient(
        base_url=settings.openrouter_base,
        http2=True,
        limits=limits,
        timeout=httpx.Timeout(connect=5, read=20, write=10, pool=5),
    )


def forward_client() -> httpx.AsyncClient:
    """Single shared client untuk forward request ke OpenRouter."""
    global _forward
    if _forward is None:
        _forward = _build_forward()
    return _forward


def meta_client() -> httpx.AsyncClient:
    """Single shared client untuk request meta (credit/models/warmup)."""
    global _meta
    if _meta is None:
        _meta = _build_meta()
    return _meta


async def aclose_all() -> None:
    """Tutup semua client (dipanggil saat shutdown lifespan)."""
    global _forward, _meta
    async with _lock:
        if _forward is not None:
            try:
                await _forward.aclose()
            finally:
                _forward = None
        if _meta is not None:
            try:
                await _meta.aclose()
            finally:
                _meta = None
