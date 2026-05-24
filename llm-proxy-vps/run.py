"""LLM Proxy Router - VPS launcher.

Modes:
  --mode server   : Production server (gunicorn+UvicornWorker di Linux, uvicorn
                    workers di Windows). Default.
  --mode dev      : Single uvicorn worker dengan reload (untuk development).

Usage:
  python run.py                       # mode server (default)
  python run.py --mode server -w 1    # eksplisit, 1 worker (recommended)
  python run.py --mode dev            # development dengan reload

CATATAN: Mode desktop (pywebview) sudah dihapus. Aplikasi ini target VPS /
headless server. Dashboard tetap tersedia via browser di http://HOST:PORT/.
"""
from __future__ import annotations

import argparse
import os
import sys

from app.config import settings


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _has_uvloop() -> bool:
    try:
        import uvloop  # noqa: F401
        return True
    except ImportError:
        return False


def _is_linux() -> bool:
    return sys.platform.startswith("linux")


# --------------------------------------------------------------------------
# Mode: server (production multi-worker)
# --------------------------------------------------------------------------

def run_server(workers: int = 1, host: str | None = None, port: int | None = None) -> None:
    """Production server.

    PENTING soal workers:
    - Pool key (`key_manager`) ada di memory per-proses. Multi-worker = pool
      TERPISAH per worker -> trial activation dobel-dobel + counter usage tidak
      shared.
    - Untuk proxy LLM, async I/O sudah bisa handle ribuan request konkuren
      dengan 1 worker. Jadi default workers=1 adalah yang BENAR.
    - Hanya naikkan workers kalau benar-benar CPU-bound (jarang untuk proxy).
    """
    host = host or settings.host
    port = port or settings.port

    if _is_linux():
        # Pakai gunicorn dengan UvicornWorker
        try:
            import gunicorn  # noqa: F401
        except ImportError:
            print("[server] gunicorn tidak terinstall. Fallback ke uvicorn workers.")
            _run_uvicorn_workers(host, port, workers)
            return

        # Exec gunicorn lewat command line untuk performa optimal
        cmd = [
            sys.executable, "-m", "gunicorn",
            "app.main:app",
            "-k", "uvicorn.workers.UvicornWorker",
            "-w", str(workers),
            "-b", f"{host}:{port}",
            "--access-logfile", "-",
            "--graceful-timeout", "30",
            "--timeout", "300",
        ]
        print(f"[server] exec: {' '.join(cmd)}")
        os.execvp(cmd[0], cmd)
    else:
        # Windows / lainnya
        _run_uvicorn_workers(host, port, workers)


def _run_uvicorn_workers(host: str, port: int, workers: int) -> None:
    import uvicorn
    print(f"[server] uvicorn workers={workers} on {host}:{port}")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        workers=workers if workers > 1 else None,
        loop="uvloop" if _has_uvloop() else "asyncio",
        http="httptools",
        access_log=False,
        log_level="info",
    )


# --------------------------------------------------------------------------
# Mode: dev (single worker, reload)
# --------------------------------------------------------------------------

def run_dev(host: str | None = None, port: int | None = None) -> None:
    import uvicorn
    host = host or settings.host
    port = port or settings.port
    print(f"[dev] uvicorn reload on {host}:{port}")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="debug",
    )


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="LLM Proxy Router launcher (VPS)")
    parser.add_argument(
        "--mode",
        choices=["server", "dev"],
        default="server",
        help="server (default, multi-worker prod) | dev (reload)",
    )
    parser.add_argument(
        "-w", "--workers", type=int, default=1,
        help="Workers untuk mode server (default 1; >1 bikin pool key terpisah per worker)",
    )
    parser.add_argument("--host", default=None, help="Override host")
    parser.add_argument("--port", type=int, default=None, help="Override port")
    args = parser.parse_args()

    if args.mode == "server":
        run_server(workers=args.workers, host=args.host, port=args.port)
    elif args.mode == "dev":
        run_dev(host=args.host, port=args.port)
    else:
        parser.error(f"unknown mode: {args.mode}")


if __name__ == "__main__":
    main()
