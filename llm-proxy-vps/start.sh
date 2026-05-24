#!/usr/bin/env bash
# Launcher Linux/macOS untuk LLM Proxy Router
set -e

cd "$(dirname "$0")"

# Pilih python: prefer 3.12, fallback ke python3
if command -v python3.12 >/dev/null 2>&1; then
    PYTHON=python3.12
elif command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
else
    echo "ERROR: python3 tidak ditemukan"
    exit 1
fi

if [ ! -d ".venv" ]; then
    echo "[setup] membuat venv ($PYTHON)..."
    "$PYTHON" -m venv .venv
    .venv/bin/python -m pip install --upgrade pip
    .venv/bin/python -m pip install -r requirements.txt
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[setup] .env dibuat dari .env.example"
fi

# Default mode: auto (deteksi DISPLAY). Pass argumen ke run.py.
exec .venv/bin/python run.py "$@"
