"""Aktivasi trial Alice -> dapat OpenRouter API key.

Memakai cloudscraper25 (https://pypi.org/project/cloudscraper25/) — fork yang
masih aktif maintained dari cloudscraper, untuk bypass proteksi Cloudflare.
Package terinstall sebagai `cloudscraper25` tapi di-import sebagai `cloudscraper`.
Dijalankan di thread pool agar tidak blocking event loop.
"""
from __future__ import annotations

import asyncio
import json
import random
import string
from typing import Any

import cloudscraper25 as cloudscraper  # disediakan oleh package cloudscraper25

from .config import settings


_EMAIL_DOMAINS = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "proton.me",
    "icloud.com",
]


def _random_email() -> str:
    user = "".join(random.choices(string.ascii_lowercase + string.digits, k=12))
    domain = random.choice(_EMAIL_DOMAINS)
    return f"{user}@{domain}"


def _activate_sync(email: str | None = None) -> dict[str, Any]:
    """Blocking call ke endpoint Alice. Dipanggil via run_in_executor."""
    email = email or _random_email()
    payload = {
        "code": settings.alice_trial_code,
        "email": email,
        "platform": settings.alice_platform,
        "version": settings.alice_version,
    }
    scraper = cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "windows", "mobile": False}
    )
    resp = scraper.post(
        settings.alice_trial_url,
        data=json.dumps(payload),
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    data["_email"] = email
    return data


async def activate_trial(email: str | None = None) -> dict[str, Any]:
    """Async wrapper. Return raw response dict dari Alice."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _activate_sync, email)


async def activate_many(n: int, concurrency: int = 3) -> list[dict[str, Any]]:
    """Aktivasi banyak trial paralel dengan batas konkurensi."""
    sem = asyncio.Semaphore(concurrency)
    results: list[dict[str, Any]] = []

    async def _one() -> None:
        async with sem:
            try:
                results.append(await activate_trial())
            except Exception as e:  # noqa: BLE001
                results.append({"error": str(e)})

    await asyncio.gather(*[_one() for _ in range(n)])
    return results
