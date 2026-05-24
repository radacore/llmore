"""Logging terpadu untuk LLM Proxy Router.

Semua module pakai `logger = logging.getLogger("llmproxy.<module>")`.
Setup ini idempotent — aman dipanggil banyak kali (mis. di reload mode dev).
"""
from __future__ import annotations

import logging
import os
import sys

_CONFIGURED = False


def mask_key(key: str | None) -> str:
    """Mask API key untuk log: 'sk-or-v1-abcd…f6f8' → tidak bocor full key.
    None / kosong → '-'.
    """
    if not key:
        return "-"
    if len(key) <= 18:
        return key[:6] + "…"
    return f"{key[:14]}…{key[-4:]}"


def setup_logging(level: str | None = None) -> None:
    """Konfigurasi root logger sekali. Aman dipanggil >1x."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    level_name = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    log_level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    fmt = "%(asctime)s %(levelname)-5s [%(name)s] %(message)s"
    handler.setFormatter(logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S"))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    # Library noise reduction
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("hpack").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Helper agar konsisten naming module logger."""
    if not name.startswith("llmproxy"):
        name = f"llmproxy.{name}"
    return logging.getLogger(name)
