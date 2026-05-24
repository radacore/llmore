"""Persistensi pool key ke disk (JSON). Async-safe via lock.

Implementasi pakai stdlib + run_in_executor — lebih ringan daripada aiofiles
untuk file kecil seperti keys.json (latency disk dominan, bukan event loop).
Atomic write via .tmp + os.replace.
"""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any


def _read_file_sync(path: Path) -> str:
    if not path.exists():
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _write_file_atomic(path: Path, content: str) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp, path)


class JsonStore:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()

    async def load(self) -> dict[str, Any]:
        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(None, _read_file_sync, self.path)
        if not raw or not raw.strip():
            return {"keys": []}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"keys": []}

    async def save(self, data: dict[str, Any]) -> None:
        async with self._lock:
            content = json.dumps(data, indent=2, ensure_ascii=False)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _write_file_atomic, self.path, content)
