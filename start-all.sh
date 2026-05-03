#!/usr/bin/env bash
# =============================================================================
# LLMore.id — Local Dev Starter
# Menjalankan semua service (Postgres, Redis, Backend, Gateway, Frontend,
# Scheduler, Queue) secara paralel. Tekan Ctrl+C untuk menghentikan semuanya.
# =============================================================================

set -u

# ------------------------ Konfigurasi ----------------------------------------
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_ROOT}/.logs"
mkdir -p "${LOG_DIR}"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
GATEWAY_PORT="${GATEWAY_PORT:-3001}"

# ------------------------ Warna ----------------------------------------------
RED='\033[0;31m'
GRN='\033[0;32m'
YEL='\033[1;33m'
BLU='\033[0;34m'
MAG='\033[0;35m'
CYN='\033[0;36m'
DIM='\033[2m'
RST='\033[0m'

log()   { printf "${CYN}[start-all]${RST} %s\n" "$*"; }
ok()    { printf "${GRN}[ ok ]${RST} %s\n" "$*"; }
warn()  { printf "${YEL}[warn]${RST} %s\n" "$*"; }
err()   { printf "${RED}[err ]${RST} %s\n" "$*" >&2; }

# ------------------------ Tracking child processes ---------------------------
PIDS=()
NAMES=()
STARTED_PG=0
STARTED_REDIS=0

cleanup() {
  echo
  log "Menerima sinyal shutdown — menghentikan semua service..."

  # Stop tracked PIDs (reverse order)
  for ((i=${#PIDS[@]}-1; i>=0; i--)); do
    pid="${PIDS[$i]}"
    name="${NAMES[$i]}"
    if kill -0 "$pid" 2>/dev/null; then
      log "  → stop ${name} (pid ${pid})"
      # Kill the process group (negative PID) supaya child node/php juga mati
      kill -TERM "-${pid}" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    fi
  done

  # Tunggu sebentar untuk graceful shutdown
  sleep 2

  # Force kill yang masih hidup
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "-${pid}" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
  done

  # Stop brew services yang kita start
  if [[ "${STARTED_PG}" == "1" ]]; then
    log "  → stop postgresql@16 (brew)"
    brew services stop postgresql@16 >/dev/null 2>&1 || true
  fi
  if [[ "${STARTED_REDIS}" == "1" ]]; then
    log "  → stop redis (brew)"
    brew services stop redis >/dev/null 2>&1 || true
  fi

  ok "Semua service dihentikan. Bye 👋"
  exit 0
}
trap cleanup INT TERM

# ------------------------ Helper ---------------------------------------------
have() { command -v "$1" >/dev/null 2>&1; }

is_port_open() {
  # macOS: pakai nc atau lsof
  if have nc; then
    nc -z 127.0.0.1 "$1" >/dev/null 2>&1
  else
    lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  fi
}

start_service() {
  local name="$1"; shift
  local color="$1"; shift
  local cwd="$1"; shift
  local logfile="${LOG_DIR}/${name}.log"

  log "▶ Memulai ${color}${name}${RST} ... (log: ${DIM}${logfile}${RST})"
  (
    cd "$cwd" || exit 1
    # set -m sudah dihandle di parent; kita pakai setsid-like via "exec"
    exec "$@"
  ) >"$logfile" 2>&1 &
  local pid=$!
  PIDS+=("$pid")
  NAMES+=("$name")
  ok "${name} started (pid ${pid})"
}

# Aktifkan job control supaya tiap child jadi process group sendiri
set -m

# ------------------------ Pre-flight checks ----------------------------------
log "Pre-flight checks..."

for cmd in php composer node npm psql redis-cli; do
  if ! have "$cmd"; then
    err "Tool '$cmd' tidak ditemukan. Install dulu (lihat tutorialjalankansecaralokal.md)."
    exit 1
  fi
done
ok "Semua tool tersedia"

# Cek .env files
[[ -f "${PROJECT_ROOT}/backend/.env"     ]] || { err "backend/.env tidak ada. Salin dari backend/.env.example"; exit 1; }
[[ -f "${PROJECT_ROOT}/gateway/.env"     ]] || { err "gateway/.env tidak ada. Salin dari gateway/.env.example"; exit 1; }
if [[ ! -f "${PROJECT_ROOT}/frontend/.env.local" ]]; then
  warn "frontend/.env.local tidak ada (frontend mungkin pakai default). Lanjut..."
fi
ok "File .env tersedia"

# ------------------------ Start PostgreSQL -----------------------------------
log "Cek PostgreSQL..."
if is_port_open 5432; then
  ok "PostgreSQL sudah berjalan di :5432"
else
  if have brew; then
    log "Menyalakan PostgreSQL via brew services..."
    if brew services start postgresql@16 >/dev/null 2>&1; then
      STARTED_PG=1
    else
      brew services start postgresql >/dev/null 2>&1 && STARTED_PG=1 || true
    fi
    # Tunggu sampai ready (max 15 detik)
    for _ in $(seq 1 15); do
      is_port_open 5432 && break
      sleep 1
    done
    if is_port_open 5432; then
      ok "PostgreSQL siap"
    else
      err "PostgreSQL gagal start. Cek: brew services list"
      exit 1
    fi
  else
    err "PostgreSQL tidak jalan & brew tidak ditemukan. Start manual: pg_ctl start"
    exit 1
  fi
fi

# ------------------------ Start Redis ----------------------------------------
log "Cek Redis..."
if is_port_open 6379; then
  ok "Redis sudah berjalan di :6379"
else
  if have brew; then
    log "Menyalakan Redis via brew services..."
    brew services start redis >/dev/null 2>&1 && STARTED_REDIS=1 || true
    for _ in $(seq 1 10); do
      is_port_open 6379 && break
      sleep 1
    done
    if is_port_open 6379; then
      ok "Redis siap"
    else
      err "Redis gagal start. Cek: brew services list"
      exit 1
    fi
  else
    err "Redis tidak jalan & brew tidak ditemukan."
    exit 1
  fi
fi

# ------------------------ Start app services ---------------------------------
echo
log "Menyalakan service aplikasi..."

# 1) Backend Laravel — php artisan serve
start_service "backend"   "${MAG}" "${PROJECT_ROOT}/backend" \
  php artisan serve --host=0.0.0.0 --port="${BACKEND_PORT}"

# 2) Backend — queue worker
start_service "queue"     "${BLU}" "${PROJECT_ROOT}/backend" \
  php artisan queue:listen --tries=1 --timeout=0

# 3) Backend — scheduler
start_service "scheduler" "${YEL}" "${PROJECT_ROOT}/backend" \
  php artisan schedule:work

# 4) Gateway Node.js
start_service "gateway"   "${CYN}" "${PROJECT_ROOT}/gateway" \
  node src/index.js

# 5) Frontend Next.js
start_service "frontend"  "${GRN}" "${PROJECT_ROOT}/frontend" \
  npm run dev

# ------------------------ Banner ---------------------------------------------
sleep 2
echo
echo "============================================================"
printf "  ${GRN}LLMore.id berjalan secara lokal 🚀${RST}\n"
echo "============================================================"
printf "  Frontend  : ${GRN}http://localhost:%s${RST}\n"  "${FRONTEND_PORT}"
printf "  Backend   : ${MAG}http://localhost:%s${RST}\n"  "${BACKEND_PORT}"
printf "  Gateway   : ${CYN}http://localhost:%s${RST}\n"  "${GATEWAY_PORT}"
printf "  Postgres  : ${BLU}localhost:5432${RST}\n"
printf "  Redis     : ${BLU}localhost:6379${RST}\n"
echo "------------------------------------------------------------"
printf "  Log files : ${DIM}%s${RST}\n" "${LOG_DIR}"
printf "  ${YEL}Tekan Ctrl+C untuk menghentikan semua service${RST}\n"
echo "============================================================"
echo

# ------------------------ Tail logs ke terminal ------------------------------
# tail multi-file dengan label warna; ini jadi proses foreground utama
tail -n 0 -F \
  "${LOG_DIR}/backend.log" \
  "${LOG_DIR}/queue.log" \
  "${LOG_DIR}/scheduler.log" \
  "${LOG_DIR}/gateway.log" \
  "${LOG_DIR}/frontend.log" &
TAIL_PID=$!
PIDS+=("$TAIL_PID")
NAMES+=("tail")

# Tunggu — kalau salah satu service mati, kita tetap stay sampai user Ctrl+C
wait "$TAIL_PID"
