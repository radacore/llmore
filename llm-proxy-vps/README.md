# LLM Proxy Router

Proxy LLM **OpenAI-compatible** untuk VPS, dengan auto-rotasi ratusan API key OpenRouter (didapat via auto-trial Alice). Sistem menjaga total credit pool ≥ $400 dan otomatis top-up ke $500 dengan trial baru saat di bawah threshold — serba otomatis, target untuk dijalankan di VPS 24/7.

> **Konsep singkat**: 1 trial OpenRouter via Alice ≈ $1 credit untuk model premium (Opus 4 dll). Dengan ratusan trial paralel di pool, total kapasitas = jumlah_key × per_key_concurrency × credit_per_key. Proxy auto-load-balance ke key paling sehat. Saat saldo total turun di bawah `REFILL_THRESHOLD_USD`, sistem otomatis bikin trial baru sampai `TARGET_TOTAL_CREDIT_USD` tercapai.

---

## Fitur

- ✅ **OpenAI-compatible** endpoint (`/v1/chat/completions`, `/v1/completions`, `/v1/models`) — drop-in untuk client mana pun.
- ✅ **Streaming SSE** zero-copy (chunk langsung di-relay, bukan buffered).
- ✅ **HTTP/2 + connection pooling** via `httpx` untuk latency rendah.
- ✅ **Auto-rotation key** dengan strategi `least_inflight` / `round_robin` / `p2c`.
- ✅ **Failover otomatis**: kalau key kena 401/402/429/5xx, request langsung di-retry ke key lain.
- ✅ **Auto credit top-up**: sistem menjaga total credit ≥ `REFILL_THRESHOLD_USD` (default $400) dan top-up ke `TARGET_TOTAL_CREDIT_USD` (default $500) saat di bawah.
- ✅ **Circuit breaker**: kalau aktivasi trial gagal beruntun (default 10×), pause 5 menit. Cegah hammer Cloudflare.
- ✅ **Pool ceiling**: hard limit jumlah key total (default 2000) untuk anti-runaway.
- ✅ **Dashboard real-time** (auto-refresh 5 detik): credit pool progress, status per key, in-flight, error.
- ✅ **Persistensi** ke `data/keys.json` → restart tidak kehilangan key.
- ✅ **Agent affinity**: header `X-Agent-ID` di-pin ke key sama → prompt caching friendly.
- ✅ **Token cap otomatis** berdasarkan sisa credit per key — anti error mid-stream.
- ✅ **401/402 tidak pernah bocor** ke client — auto-konversi ke 503 supaya tidak leak detail OpenRouter.

---

## Struktur

```
.
├── run.py                              ← launcher (server/dev mode)
├── requirements.txt
├── start.sh                            ← shortcut linux/mac
├── .env.example                        ← copy ke .env
├── data/keys.json                      ← pool key persistent (auto-managed)
└── app/
    ├── config.py                       ← settings dari .env
    ├── storage.py                      ← JSON persistence (atomic write)
    ├── trial_activator.py              ← cloudscraper25 → daftar trial Alice
    ├── credit_checker.py               ← cek sisa credit OpenRouter
    ├── key_manager.py                  ← pool, rotation, locking, auto top-up
    ├── proxy.py                        ← forward request (HTTP/2 + streaming + failover)
    ├── main.py                         ← FastAPI app + dashboard
    └── templates/dashboard.html
```

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

> Tambahan opsional untuk performa di Linux/macOS:
> ```bash
> pip install uvloop
> ```
> (Sudah ada di `requirements.txt` untuk Linux/Mac.)

### 2. Copy & edit konfigurasi

```bash
# Linux/macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Edit `.env` — minimal cek `ALICE_TRIAL_URL`, `ALICE_TRIAL_CODE`, `ALICE_PLATFORM`, `ALICE_VERSION` agar sesuai dengan endpoint Alice yang aktif.

### 3. Setting penting

| Variable | Default | Keterangan |
|---|---|---|
| **`PORT`** | `9898` | Port HTTP server |
| **Auto Top-Up** | | |
| `TARGET_TOTAL_CREDIT_USD` | `500` | Target total credit semua key sehat (USD) |
| `REFILL_THRESHOLD_USD` | `400` | Auto top-up dipicu saat total credit < threshold |
| `POOL_CEILING` | `2000` | Hard ceiling jumlah total key (anti-runaway) |
| `TRIAL_CREATE_CONCURRENCY` | `8` | Paralelisme saat bikin trial baru |
| `TRIAL_FAILURE_THRESHOLD` | `10` | Gagal berturut-turut sebelum circuit breaker open |
| `TRIAL_FAILURE_COOLDOWN_S` | `300` | Detik cooldown saat circuit breaker open |
| **Pool & Concurrency** | | |
| `POOL_SIZE` | `10` | Minimum floor jumlah key (back-compat) |
| `PER_KEY_CONCURRENCY` | `4` | Request bersamaan max per key |
| `LOAD_BALANCE_STRATEGY` | `least_inflight` | `least_inflight` \| `round_robin` \| `p2c` |
| `ACQUIRE_TIMEOUT` | `30` | Detik tunggu slot key kosong sebelum 503 |
| `MAX_CONCURRENT_REQUESTS` | `0` | Hard cap global. 0 = auto (`healthy * per_key * 1.5`) |
| `AGENT_AFFINITY` | `true` | Pakai key sama untuk request dengan `X-Agent-ID` yang sama |
| **Credit & Refresh** | | |
| `MIN_CREDIT_USD` | `0.10` | Threshold credit, di bawah ini key auto-dihapus |
| `CREDIT_REFRESH_INTERVAL` | `60` | Detik antara refresh credit + cek top-up |
| **HTTP Client** | | |
| `HTTP_MAX_CONNECTIONS` | `500` | Pool koneksi httpx ke OpenRouter |
| `HTTP_MAX_KEEPALIVE` | `200` | Keep-alive max |
| **Auth & Misc** | | |
| `DEFAULT_MODEL` | `anthropic/claude-opus-4.7` | Model default |
| `PROXY_API_KEY` | (kosong) | Kalau diisi, client harus pakai `Authorization: Bearer <key>` |
| `KEYS_DB_PATH` | `./data/keys.json` | Path penyimpanan pool key |

---

## Cara Jalankan

### Server Mode (default — untuk VPS / Linux)

```bash
python run.py
```

Setara dengan `python run.py --mode server`. Di Linux otomatis pakai `gunicorn + UvicornWorker`. Di Windows fallback ke `uvicorn` langsung.

```bash
# Override port / host
python run.py --port 9898 --host 0.0.0.0

# Eksplisit 1 worker (recommended — lihat catatan di bawah)
python run.py --mode server -w 1

# Background via nohup
nohup python run.py > proxy.log 2>&1 &
```

> **⚠️ Soal `-w` (workers)**: state pool key ada di memory **per-proses**. `-w 4` = 4 pool **terpisah** dengan trial activation dobel-dobel = boros credit dan tidak sinkron. **Default `-w 1` adalah yang benar** — async I/O sudah bisa handle ribuan request konkuren tanpa multi-process.

### Dev Mode (reload otomatis)

```bash
python run.py --mode dev
```

Single uvicorn worker dengan `--reload` aktif. Untuk development saja, jangan dipakai produksi.

### Cara kerja auto top-up

1. Saat startup, proxy load `data/keys.json` lalu refresh credit semua key.
2. Background task `ensure_credit_target()` jalan:
   - Refresh credit semua key (akurat) → buang yang `remaining <= MIN_CREDIT_USD`.
   - Hitung `total = sum(remaining sehat)`.
   - Jika `total >= REFILL_THRESHOLD_USD` → **no-op**.
   - Jika `total < REFILL_THRESHOLD_USD`:
     - `need_usd = TARGET - total`
     - `avg_per_key = avg(remaining)` fallback $1.0
     - `n_keys = ceil(need_usd / avg_per_key)`
     - Dibatasi `POOL_CEILING - current_total_keys`.
     - Bikin trial paralel (`TRIAL_CREATE_CONCURRENCY=8` concurrent).
3. Loop berulang setiap `CREDIT_REFRESH_INTERVAL` detik (default 60s).
4. Kalau aktivasi gagal beruntun ≥ `TRIAL_FAILURE_THRESHOLD` → **circuit breaker open** selama `TRIAL_FAILURE_COOLDOWN_S` (log `ERROR` `[circuit] trial activation circuit OPEN ...`). Proxy tetap layani request dari key yang sudah ada; hanya berhenti coba bikin baru.

### Mode operasi normal

Setelah startup pertama yang panjang (bisa 10-30 menit untuk capai $500 dari nol — tergantung respon Alice/Cloudflare), sistem masuk **steady state**:

- `ensure_credit_target` jalan tiap 60s, biasanya no-op karena saldo > threshold.
- Saat traffic produksi mulai pakai credit dan turun < $400, sistem auto top-up lagi.
- Saat key habis (< $0.10), auto-dihapus saat refresh.
- Dashboard menampilkan progress real-time.

---

## Cara Pakai sebagai Proxy

### OpenAI Python SDK

```python
from openai import OpenAI
client = OpenAI(
    base_url="http://localhost:9898/v1",
    api_key="ignored-or-PROXY_API_KEY",
)
resp = client.chat.completions.create(
    model="anthropic/claude-opus-4.7",
    messages=[{"role": "user", "content": "Halo!"}],
    stream=True,
)
for chunk in resp:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

### curl

```bash
curl http://localhost:9898/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-opus-4.7",
    "messages": [{"role": "user", "content": "Halo!"}],
    "stream": true
  }'
```

### LangChain / LiteLLM / dst

Set `OPENAI_BASE_URL=http://localhost:9898/v1` dan `OPENAI_API_KEY=anything` (atau nilai `PROXY_API_KEY` kalau auth aktif).

---

## Dashboard

Buka [`http://localhost:9898`](http://localhost:9898).

**Stat cards:**
- Total Keys / Healthy / In-Flight / Capacity / Utilization / Max-on-1-Key / Total Requests / Total Errors
- **Credit Pool (USD)** — `$X / $TARGET` dengan warna hijau saat ≥ threshold, kuning saat di bawah, tag merah "CIRCUIT OPEN" kalau breaker aktif.
- LB Strategy

**Toolbar:**
- Pool Size + tombol **Set** — ubah `POOL_SIZE` minimum floor runtime
- Input jumlah key (1-50) + tombol **+ Create Keys** (manual override, bukan auto top-up)
- **⚙ Ensure Pool** — top-up sampai `POOL_SIZE` floor
- **↻ Refresh Credits** — cek ulang credit semua key
- **🔥 Warm-Up** — test setiap key vs model free

**Tabel per-key:**
- Preview key (masked), email, status (active/empty/disabled), warm-up, in-flight, total requests, errors, credit bar visual, expires, last error, tombol hapus.

Auto-refresh tiap 5 detik.

---

## API Management

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/stats` | Snapshot pool + per-key stats + config |
| `POST` | `/api/keys/create` | Body `{"count": N}` — buat N key baru manual |
| `POST` | `/api/keys/refresh` | Refresh credit semua key |
| `POST` | `/api/keys/ensure` | Top-up sampai `POOL_SIZE` floor |
| `POST` | `/api/keys/ensure_credit` | Paksa cek + top-up sampai `TARGET_TOTAL_CREDIT_USD` sekarang |
| `POST` | `/api/keys/warmup` | Test semua key ke free model |
| `DELETE` | `/api/keys/{prefix}` | Hapus key by prefix |
| `POST` | `/api/settings` | Update `pool_size` / `per_key_concurrency` / `load_balance_strategy` / `agent_affinity` |
| `GET` | `/api/models/free` | Daftar model gratis OpenRouter |
| `POST` | `/api/models/refresh` | Refresh cache models |

### Health & Observability

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/healthz` | Liveness — selalu 200 kalau proses jalan |
| `GET` | `/readyz` | Readiness — 200 kalau ada ≥1 healthy key, else 503 |
| `GET` | `/metrics` | Prometheus plaintext: pool/in-flight/utilization/credit/uptime |

Setiap response punya header `X-Request-ID` (auto-generated atau echo dari `X-Request-ID` di request) untuk tracing log.

---

## Optimasi Kecepatan

1. **Tidak parse body penuh** — request body diforward sebagai bytes; cuma sekali `json.loads` minimal untuk cek flag `stream` dan inject `max_tokens` cap.
2. **HTTP/2 multiplexing** — 1 koneksi bisa carry banyak request paralel ke OpenRouter.
3. **Connection pool besar** (`HTTP_MAX_CONNECTIONS=500`, `HTTP_MAX_KEEPALIVE=200`).
4. **Streaming chunk via `aiter_raw`** — zero re-encoding, langsung passthrough bytes.
5. **`uvloop` + `httptools`** kalau tersedia (Linux/Mac) → boost ~2-3×.
6. **Single async worker** — tidak ada inter-process overhead.

---

## Multi-Agent / Sub-Agent (OpenCode, Cline, dll)

Proxy ini **dioptimasi untuk client multi-agent** seperti OpenCode yang sering spawn 5-10 sub-agent paralel.

### Yang sudah dilakukan otomatis

- ✅ **Load-balancing `least_inflight`** — burst dari 10 sub-agent paralel otomatis tersebar ke 10 key berbeda.
- ✅ **Tie-breaker by `total_requests`** — fairness antar key.
- ✅ **Anti-thundering-herd** — saat semua key full, request menunggu sampai `ACQUIRE_TIMEOUT` lalu di-wake oleh `release()` event. Tidak ada busy-loop.
- ✅ **Global concurrency cap** — `MAX_CONCURRENT_REQUESTS` mencegah server kewalahan.
- ✅ **Agent affinity** — header `X-Agent-ID` (atau `X-Subagent-ID` / `X-Task-ID` / `X-Session-ID`) → key yang sama → prompt caching OpenRouter aktif.
- ✅ **HTTP/2 multiplexing** — koneksi ke OpenRouter jauh > total in-flight, bukan bottleneck.

### Tuning untuk OpenCode

```env
POOL_SIZE=10                       # floor minimum saja (auto top-up biasanya jauh melebihi)
PER_KEY_CONCURRENCY=4              # 4 request/key
LOAD_BALANCE_STRATEGY=least_inflight
ACQUIRE_TIMEOUT=30
MAX_CONCURRENT_REQUESTS=0          # auto
AGENT_AFFINITY=true                # prompt caching friendly
```

> **Rule of thumb**: `kapasitas total = HEALTHY_KEYS × PER_KEY_CONCURRENCY`.
> Dengan 1000 key dan per_key=4, kapasitas = 4000 slot — jauh lebih dari cukup untuk OpenCode (max ~10 parallel sub-agent).

### Cara kirim header dari OpenCode

OpenCode (atau client lain yang spawn sub-agent) bisa kirim header berikut untuk dapat manfaat agent affinity (prompt caching):

| Header | Keterangan |
|---|---|
| `X-Agent-ID` | ID utama agent / session |
| `X-Subagent-ID` | ID sub-agent (fallback) |
| `X-Opencode-Agent` | OpenCode-specific |
| `X-Task-ID` | Task tool invocation |
| `X-Session-ID` | Session-wide identifier |

Proxy akan cek dengan urutan di atas dan ambil yang pertama ditemukan. Kalau header ada, request berturut-turut dari ID yang sama akan diarahkan ke key yang sama (kalau key tersebut sehat dan punya slot).

### Mode strategy lain

```env
# round_robin: rotasi sederhana, fair tapi tidak optimal untuk burst
LOAD_BALANCE_STRATEGY=round_robin

# p2c (power-of-2 choices): pilih 2 random key, ambil yang lebih sehat
LOAD_BALANCE_STRATEGY=p2c
```

`least_inflight` recommended untuk multi-agent. `p2c` bagus untuk pool sangat besar (>100 key) supaya tidak scan linear.

---

## Catatan Stabilitas

- **401/402 tidak pernah bocor**: jika OpenRouter return 401 (auth gagal) atau 402 (payment required), proxy auto-hapus key tersebut dan retry ke key lain. Jika SEMUA attempt habis dengan 401/402, proxy return **503** ke client (bukan 401/402) supaya tidak leak detail.
- **Stream release di `finally` generator**: bahkan kalau client disconnect di tengah stream, slot `in_flight` di-release dengan benar. Tidak ada leak.
- **Two httpx clients terpisah**: `forward_client` (HTTP/2, pool besar) untuk request user, `meta_client` (pool kecil) untuk credit check + activation. Isolasi → trial activation lambat tidak mengganggu request latency.
- **`_slot_event` broadcast pattern**: wait queue tanpa starvation. Semua waiter di-wake serentak saat key release, race-free karena ada lock di acquire.
- **Token cap otomatis**: berdasarkan `credit_remaining` × `credit_to_tokens_ratio` (default 50000), dibatasi `auto_max_tokens_cap` (32000). Mencegah error mid-stream karena over-budget.

---

## Production Hardening

### Logging

Format structured: `<timestamp> <LEVEL> [llmproxy.<module>] <message>`. Log noise dari httpx/httpcore/hpack/uvicorn.access di-silent.

```bash
# Capture log ke file
nohup python run.py > /var/log/llm-proxy.log 2>&1 &
```

Atau pakai journald via systemd (lihat section deployment).

### Security

1. **`PROXY_API_KEY`** — set di `.env` kalau endpoint exposed ke internet. Format request:
   ```
   Authorization: Bearer <PROXY_API_KEY>
   ```
2. **Bind ke localhost saja** jika di belakang reverse proxy: `HOST=127.0.0.1`.
3. **Restrict `/metrics`** di reverse proxy layer (mis. allow internal IP saja).
4. **Jangan expose `/api/*` endpoint management ke publik** kalau memungkinkan — gunakan tunnel SSH atau IP whitelist.

### Observability

- `/metrics` Prometheus: pool_size, in_flight, utilization, total_credit_usd, uptime, dst.
- `X-Request-ID` di setiap response untuk tracing.
- Dashboard menampilkan real-time state.

### Resource Management

- **Memory**: ~150-300 MB stabil dengan 1000-2000 key (sebagian besar untuk httpx pool + asyncio).
- **CPU**: idle <5%. Spike saat aktivasi trial paralel (cloudscraper25 CPU-bound).
- **Network**: outbound ke OpenRouter (per request) + Alice (saat top-up). HTTP/2 multiplexing menjaga koneksi reuse.

### Deployment Checklist

```env
# Production .env minimal
HOST=0.0.0.0                            # atau 127.0.0.1 kalau di belakang reverse proxy
PORT=9898
LOG_LEVEL=info

# Auto top-up
TARGET_TOTAL_CREDIT_USD=500
REFILL_THRESHOLD_USD=400
POOL_CEILING=2000
TRIAL_CREATE_CONCURRENCY=8
TRIAL_FAILURE_THRESHOLD=10
TRIAL_FAILURE_COOLDOWN_S=300

# Concurrency
POOL_SIZE=10
PER_KEY_CONCURRENCY=4
LOAD_BALANCE_STRATEGY=least_inflight
ACQUIRE_TIMEOUT=30
AGENT_AFFINITY=true

# Auth
PROXY_API_KEY=<generate-random-32-char>

# Alice (jangan lupa)
ALICE_TRIAL_URL=https://alice.overment.com/trial/activate
ALICE_TRIAL_CODE=TRIAL
ALICE_PLATFORM=windows — 10.0.26200
ALICE_VERSION=5.2.1
```

### systemd unit (bare-metal Linux)

`/etc/systemd/system/llm-proxy.service`:

```ini
[Unit]
Description=LLM Proxy Router
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/llm-proxy
ExecStart=/opt/llm-proxy/.venv/bin/python run.py
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now llm-proxy
sudo journalctl -u llm-proxy -f
```

### Reverse proxy (nginx) untuk HTTPS

```nginx
upstream llm_proxy {
    server 127.0.0.1:9898;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name proxy.example.com;
    # ssl_certificate ... (let's encrypt via certbot)

    location /v1/ {
        proxy_pass http://llm_proxy;
        proxy_http_version 1.1;
        proxy_buffering off;            # WAJIB untuk streaming SSE
        proxy_read_timeout 600s;
        proxy_set_header X-Request-ID $request_id;
        proxy_set_header Authorization $http_authorization;
    }

    location = /healthz { proxy_pass http://llm_proxy; access_log off; }
    location = /readyz  { proxy_pass http://llm_proxy; access_log off; }
    location = /metrics {
        allow 10.0.0.0/8;               # restrict ke jaringan internal
        deny all;
        proxy_pass http://llm_proxy;
    }

    # Dashboard & API management — restrict atau hilangkan jika publik
    location / {
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://llm_proxy;
    }
}
```

### Docker (placeholder — akan ditambahkan)

Saat ini repo belum punya `Dockerfile` dan `docker-compose.yml`. Untuk menjalankan di Docker:

1. Mount `data/keys.json` sebagai volume supaya pool key persisten antar container restart.
2. Set `restart: always` di compose supaya container auto-restart.
3. Expose port 9898 (atau bind ke `127.0.0.1` kalau di belakang Nginx Proxy Manager).

(Dockerfile + compose menyusul.)

### Nginx Proxy Manager (NPM)

Kalau pakai NPM di VPS:

1. Tambah **Proxy Host** baru di NPM UI.
2. Forward Hostname/IP: IP container atau `127.0.0.1`.
3. Forward Port: `9898`.
4. **Tab SSL**: Request Let's Encrypt cert untuk domain.
5. **Tab Advanced** — paste config berikut supaya streaming SSE jalan:
   ```nginx
   proxy_buffering off;
   proxy_read_timeout 600s;
   proxy_http_version 1.1;
   ```
6. Kalau `PROXY_API_KEY` aktif, NPM tidak perlu auth tambahan — client kirim `Authorization: Bearer <key>` langsung ke domain.

---

## Troubleshooting

**Trial activation gagal beruntun** — circuit breaker akan auto-open setelah `TRIAL_FAILURE_THRESHOLD` (default 10) kegagalan berturut-turut, lalu pause `TRIAL_FAILURE_COOLDOWN_S` detik. Cek log `ERROR [circuit] trial activation circuit OPEN ...`. Penyebab umum: Cloudflare challenge baru, endpoint Alice down, atau IP VPS di-rate-limit. Update `cloudscraper25`:

```bash
pip install -U cloudscraper25
```

**Total credit pool stuck di bawah threshold** — biasanya berarti `POOL_CEILING` tercapai. Cek `/api/stats` field `pool_ceiling`, `total_keys`, `trial_circuit_open`, `trial_cooldown_remaining_s`. Naikkan `POOL_CEILING` di `.env` lalu restart.

**`http 429` di kolom Last Error semua key** — rate-limit OpenRouter saat traffic burst. Non-fatal: failover sudah handle (429 ada di `_FAILOVER_CODES` dan **bukan** di `_DELETE_KEY_CODES`), jadi key tidak dihapus. Status tetap `active`. Akan tergantikan begitu key sukses melayani request berikutnya.

**`Credit checker selalu error`** — pastikan key benar-benar dari OpenRouter (format `sk-or-v1-...`). Trial Alice langsung return key OpenRouter yang valid.

**Streaming response terpotong / buffered** — pastikan reverse proxy punya `proxy_buffering off;` dan `proxy_read_timeout 600s;` (atau lebih lama untuk model yang slow seperti Opus).

**Banyak request 503 saat burst** — naikkan `PER_KEY_CONCURRENCY` (rate-limit OpenRouter sangat longgar) atau `ACQUIRE_TIMEOUT`. Cek `/api/stats` `global_utilization_pct` — kalau mendekati 100%, capacity habis.

**`POOL_CEILING` tercapai tapi target credit tidak tercapai** — rata-rata credit per trial mungkin lebih kecil dari ekspektasi (Alice memberi credit acak $0.5-$1.5). Naikkan ceiling, atau turunkan `TARGET_TOTAL_CREDIT_USD` ke nilai realistis.

---

## Disclaimer

Kode ini disediakan as-is untuk keperluan integrasi yang sah. Pastikan Anda memiliki izin untuk menggunakan endpoint trial Alice secara otomatis dan tidak melanggar TOS OpenRouter. Penggunaan untuk abuse, pelanggaran ToS, atau aktivitas ilegal **bukan tanggung jawab maintainer**.
