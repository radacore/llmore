"""Cek sisa credit OpenRouter per API key.

Menggunakan endpoint /api/v1/key yang return limit, usage, limit_remaining,
is_free_tier, dll. Lebih reliable dari /auth/key.
"""
from __future__ import annotations

import httpx

from .config import settings


async def fetch_credit(api_key: str, client: httpx.AsyncClient) -> dict:
    """Return dict {limit, usage, remaining, is_free_tier, label}.

    Jika gagal, return {error: str}.
    """
    try:
        r = await client.get(
            f"{settings.openrouter_base}/key",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15,
        )
        r.raise_for_status()
        data = r.json().get("data", {})
        return {
            "limit": data.get("limit"),
            "usage": data.get("usage", 0) or 0,
            "remaining": data.get("limit_remaining"),
            "is_free_tier": data.get("is_free_tier", False),
            "label": data.get("label", ""),
        }
    except httpx.HTTPStatusError as e:
        return {"error": f"http {e.response.status_code}"}
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)}
