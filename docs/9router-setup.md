# Setup 9router (Sibling Repo)

LLMora memakai **9router** sebagai router pool antara `gateway` dan `llm-proxy`. 9router adalah repo terpisah (sibling), bukan submodule. Anda meng-clone dan meng-update-nya secara mandiri di samping folder LLMora.

```
Client → LLMora gateway (auth/quota/billing)
      → 9router (pool router, combo, A/B + failover)
      → llm-proxy (key rotation)
      → OpenRouter
```

## Repo & Branch

- Repo: **https://github.com/radacore/9router.git** (fork LLMora dari `decolua/9router`)
- Branch yang dipakai LLMora: **`fix/combo-with-slash`**
  - Mengizinkan combo name memuat `/` (mis. `anthropic/claude-opus-4.7`) supaya bisa mirror upstream model ID.
  - `master` di fork tetap tracking upstream untuk sinkronisasi update; jangan dipakai langsung.

## Lokasi Clone

LLMora mengharapkan 9router berada di folder **sibling** dari repo LLMora:

```
parent/
├── llmore/        ← repo LLMora
└── 9router/       ← clone fork radacore
```

Di mesin pengembang yang dipakai sekarang berarti `/Users/rada/Documents/llmore/9router`. Folder ini sudah ada di `.gitignore` LLMora sehingga tidak akan ikut commit.

## Setup Pertama Kali

```bash
# 1) Clone fork di branch yang benar (sibling LLMora)
cd /Users/rada/Documents
git clone -b fix/combo-with-slash https://github.com/radacore/9router.git llmore/9router

# 2) Siapkan .env (lihat tabel di bawah)
cd llmore/9router
cat > .env <<'ENV'
JWT_SECRET=<openssl rand -hex 32>
INITIAL_PASSWORD=<password dashboard>
DATA_DIR=/Users/rada/Documents/llmore/9router/data
PORT=20128
NODE_ENV=development
REQUIRE_API_KEY=false
AUTH_COOKIE_SECURE=false
ENABLE_REQUEST_LOGS=true
OBSERVABILITY_ENABLED=true
BASE_URL=http://localhost:20128
NEXT_PUBLIC_BASE_URL=http://localhost:20128
ENV

mkdir -p data
```

Tidak perlu `npm install` manual — `start-all.sh` di repo LLMora akan otomatis menjalankan bootstrap saat `9router/node_modules` belum ada.

### Variabel `.env`

| Variable | Deskripsi |
| --- | --- |
| `JWT_SECRET` | Secret untuk sesi dashboard 9router. Generate dengan `openssl rand -hex 32` |
| `INITIAL_PASSWORD` | Password admin dashboard (`/dashboard`). Hanya dipakai saat login pertama |
| `DATA_DIR` | Folder SQLite + log. Pakai path absolut |
| `PORT` | Port HTTP 9router (default 20128). Harus match dengan `UPSTREAM_API_URL` LLMora |
| `NODE_ENV` | `development` untuk lokal, `production` untuk VPS |
| `REQUIRE_API_KEY` | `false` untuk internal trust. `true` kalau ingin gateway LLMora kirim Bearer ke 9router |
| `AUTH_COOKIE_SECURE` | `false` di HTTP lokal, `true` di HTTPS production |
| `BASE_URL` / `NEXT_PUBLIC_BASE_URL` | URL dashboard, dipakai untuk redirect/cookie scope |

## Setup Dashboard (Manual, Sekali Saja)

Setelah `./start-all.sh` jalan, buka **http://localhost:20128/dashboard** dan login dengan `INITIAL_PASSWORD`.

1. **Providers → Add Provider** (jenis OpenAI-compatible)
   - Prefix: `llmora-proxy` (atau prefix lain — wajib unik)
   - Base URL: `http://127.0.0.1:9898/v1` (lokal) atau `http://llm-proxy:9898/v1` (docker compose)
   - API Key field: isi placeholder apa saja (mis. `dummy`); LLMora `llm-proxy` tidak mengecek auth selama `PROXY_API_KEY` di `.env`-nya kosong.

2. **Connections → Add Connection**
   - Pilih provider di atas, `isActive=true`, `priority=1`.

3. **Combos → Create Combo** untuk tiap model yang ingin diekspos ke gateway LLMora:
   - Name: sama persis dengan model ID upstream, mis. `anthropic/claude-opus-4.7`.
   - Models: `["llmora-proxy/anthropic/claude-opus-4.7"]` (prefix provider + model ID).

Combo dengan nama yang mengandung `/` butuh patch di branch `fix/combo-with-slash` — sudah ada di branch tersebut.

## Update Flow

Karena 9router adalah repo terpisah, update dilakukan dua kali pull:

```bash
# Update LLMora
cd /Users/rada/Documents/llmore
git pull origin main

# Update 9router
cd 9router
git pull origin fix/combo-with-slash
```

Setelah pull 9router, restart `./start-all.sh` (atau biarkan Next.js HMR yang pick up perubahan kalau service dev mode masih jalan).

### Sinkronisasi dengan upstream `decolua/9router`

Untuk mengambil update dari upstream tanpa kehilangan patch combo:

```bash
cd /Users/rada/Documents/llmore/9router

# Tambah remote upstream sekali saja
git remote add upstream https://github.com/decolua/9router.git

# Tarik update upstream ke master fork
git fetch upstream
git checkout master
git merge upstream/master
git push origin master

# Rebase branch fix/combo-with-slash di atas master baru
git checkout fix/combo-with-slash
git rebase master
git push --force-with-lease origin fix/combo-with-slash
```

## Deploy di VPS

Karena pilihan repo adalah dua-clone-terpisah (bukan submodule, bukan vendoring), workflow di VPS:

```bash
# 1) Clone LLMora
cd /opt
git clone https://github.com/radacore/llmore.git
cd llmore

# 2) Clone 9router sibling di folder yang sama
git clone -b fix/combo-with-slash https://github.com/radacore/9router.git ./9router

# 3) Siapkan .env LLMora + 9router (lihat tabel di README + section di atas)
cp .env.example .env
# isi backend/.env, gateway/.env, 9router/.env

# 4) Jalankan
./start-all.sh    # untuk dev/staging
# atau: docker compose up -d  (production — pastikan 9router juga di-orchestrate, lihat catatan di bawah)
```

> **Catatan docker compose:** file `docker-compose.yml` LLMora saat ini **belum** menambahkan service `9router`. Untuk production VPS, Anda perlu mendaftarkan 9router sebagai service tambahan di compose Anda sendiri (build dari folder sibling `../9router/`), atau jalankan 9router via PM2/systemd terpisah. `start-all.sh` di-fork untuk dev lokal saja.

Update di VPS:

```bash
cd /opt/llmore && git pull origin main
cd /opt/llmore/9router && git pull origin fix/combo-with-slash
# restart layanan terkait (pm2 / systemd / docker compose restart)
```

## Troubleshooting

- **`/api/v1/chat/completions` 400 `model_not_found`**: combo dengan nama persis model belum dibuat di dashboard, atau berada di branch tanpa patch slash.
- **`/dashboard/combos` kosong walau combo sudah ada di SQLite**: combo dibuat dengan `kind` non-NULL. Dashboard memfilter `kind=NULL` untuk LLM combo. Update SQLite: `UPDATE combos SET kind=NULL WHERE name='…'`.
- **9router gagal start (port bentrok)**: pastikan port 20128 free. Ganti `PORT` di `9router/.env` + `UPSTREAM_API_URL` di `backend/.env`, `gateway/.env`, dan `ROUTER_PORT` di `start-all.sh` (default `${ROUTER_PORT:-20128}`).
- **Auth ke dashboard gagal**: cookie scope tidak match. Pastikan `BASE_URL` di `9router/.env` sama dengan host yang Anda buka di browser.

## Referensi Lain

- Arsitektur end-to-end LLMora: [`README.md`](../README.md) section "Arsitektur" + diagram mermaid.
- Setup lokal step-by-step: [`tutorialjalankansecaralokal.md`](../tutorialjalankansecaralokal.md).
- Upstream pool key OpenRouter: [`llm-proxy-vps/README.md`](../llm-proxy-vps/README.md).
