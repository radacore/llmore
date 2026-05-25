# 🚀 Tutorial Menjalankan LLMora.id Secara Lokal

Panduan lengkap untuk menjalankan proyek **LLMora.id — AI Gateway Platform** di lingkungan development lokal.

---

## 📐 Arsitektur Singkat

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (User)                      │
│                   http://localhost:3000                  │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  🖥️ Frontend         │      │  🤖 Gateway (Node.js)    │
│  Next.js (port 3000)│      │  Express (port 3001)    │
│  - Dashboard UI     │      │  - AI Chat Proxy        │
│  - Auth Pages       │      │  - Rate Limiting        │
└──────────┬──────────┘      └──────────┬──────────────┘
           │ REST API                   │ Redis
           ▼                            ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  ⚙️ Backend (Laravel)│◄────►│  🔴 Redis (port 6379)   │
│  PHP (port 8000)    │      │  - Cache & Rate Limit   │
│  - Auth & Users     │      │  - API Key Cache        │
│  - Billing & Plans  │      └─────────────────────────┘
│  - API Key Mgmt     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  🐘 PostgreSQL       │
│  (port 5432)        │
│  - Database utama   │
└─────────────────────┘
```

**Alur data:**
1. **Frontend** menampilkan UI dan mengirim request ke **Backend** untuk auth, billing, dan manajemen API key
2. **Gateway** menerima request AI dari client, memvalidasi API key via **Redis**, dan meneruskan ke service **LLM Proxy** (FastAPI) yang me-rotasi pool API key OpenRouter
3. **Backend** menyimpan data di **PostgreSQL** dan meng-cache API key di **Redis**

---

## ✅ Prerequisites

### Software yang Dibutuhkan

| Software       | Versi Minimum | Keterangan                    |
|----------------|---------------|-------------------------------|
| PHP            | 8.3+          | Untuk Laravel backend         |
| Composer       | 2.x           | Package manager PHP           |
| Node.js        | 20+           | Untuk frontend & gateway      |
| npm            | 10+           | Package manager Node.js       |
| PostgreSQL     | 16+           | Database utama                |
| Redis          | 7+            | Cache & rate limiting         |
| Git            | 2.x           | Version control               |

### 🍺 Install di macOS (Homebrew)

```bash
# Install semua dependencies sekaligus
brew install php composer postgresql@16 redis node@20

# Jalankan PostgreSQL & Redis sebagai background service
brew services start postgresql@16
brew services start redis

# Verifikasi instalasi
php -v          # PHP 8.3.x
composer -V     # Composer version 2.x
node -v         # v20.x.x
npm -v          # 10.x.x
psql --version  # psql (PostgreSQL) 16.x
redis-cli ping  # PONG
```

> 💡 **Tips:** Jika `node` atau `psql` tidak ditemukan setelah install, tambahkan ke PATH:
> ```bash
> echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
> echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```

---

## 🔑 API Keys yang Dibutuhkan

> ⚠️ **Catatan:** API keys bersifat **opsional untuk development awal**. Aplikasi tetap bisa berjalan tanpa API keys ini, namun fitur terkait tidak akan berfungsi.

| API Key             | Kegunaan                          | Cara Mendapatkan                                          |
|---------------------|-----------------------------------|----------------------------------------------------------|
| Google OAuth        | Login via Google                  | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs |
| Midtrans Sandbox    | Payment gateway (sandbox mode)    | [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/) → Settings → Access Keys |
| OpenRouter API Key  | Upstream LLM (dipool di service `llm-proxy`, dirouting lewat 9router) | [OpenRouter](https://openrouter.ai/keys) atau auto-trial via Alice/overment (lihat `llm-proxy-vps/README.md`) |
| 9router (radacore fork) | Router pool antara gateway dan llm-proxy | Clone manual branch `fix/combo-with-slash`: `git clone -b fix/combo-with-slash https://github.com/radacore/9router.git /Users/rada/Documents/llmore/9router` lalu buat `9router/.env` (JWT_SECRET, INITIAL_PASSWORD, DATA_DIR, PORT=20128). Workflow lengkap di [`docs/9router-setup.md`](docs/9router-setup.md) |

### Cara Setup Google OAuth
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Buka **APIs & Services** → **Credentials**
4. Klik **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:8000/api/auth/google/callback`
7. Catat **Client ID** dan **Client Secret**

---

## 🛠️ Opsi 1: Manual Setup (Tanpa Docker)

### Step 1: Setup PostgreSQL

```bash
# Buat user PostgreSQL
createuser --interactive --pwprompt llmore
# Saat diminta password, masukkan: secret
# Shall the new role be a superuser? → n
# Shall the new role be allowed to create databases? → y
# Shall the new role be allowed to create more new roles? → n

# Buat database
createdb -O llmore llmore

# Verifikasi koneksi
psql -U llmore -d llmore -c "SELECT 1;"
```

> 💡 Jika `createuser` gagal karena auth, coba:
> ```bash
> psql postgres -c "CREATE USER llmore WITH PASSWORD 'secret' CREATEDB;"
> psql postgres -c "CREATE DATABASE llmore OWNER llmore;"
> ```

---

### Step 2: Setup Backend Laravel

```bash
# Masuk ke direktori backend
cd backend

# Install dependencies PHP
composer install

# Copy file environment
cp .env.example .env
```

Edit file `backend/.env` dengan konfigurasi berikut:

```env
APP_NAME=LLMora
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database — ubah dari sqlite ke pgsql
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=llmore
DB_USERNAME=llmore
DB_PASSWORD=secret

# Redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache & Session menggunakan Redis
CACHE_STORE=redis
SESSION_DRIVER=redis

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:3000

# Google OAuth (opsional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback

# Midtrans Sandbox (opsional)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/v1/transactions
MIDTRANS_API_URL=https://api.sandbox.midtrans.com/v2
```

Lanjutkan setup:

```bash
# Generate application key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate

# Jalankan seeder (buat akun admin + data plans)
php artisan db:seed

# Jalankan backend server
php artisan serve
# ✅ Backend berjalan di http://localhost:8000
```

> 🔐 **Pastikan ekstensi PHP berikut terinstall:**
> - `pdo_pgsql` (untuk PostgreSQL)
> - `phpredis` (untuk Redis)
>
> Cek dengan: `php -m | grep -E "pdo_pgsql|redis"`
>
> Install jika belum ada:
> ```bash
> pecl install redis
> # Untuk pdo_pgsql biasanya sudah include di brew install php
> ```

---

### Step 3: Setup Frontend Next.js

```bash
# Buka terminal baru, masuk ke direktori frontend
cd frontend

# Install dependencies
npm install

# Buat file environment
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
EOF

# Jalankan development server
npm run dev
# ✅ Frontend berjalan di http://localhost:3000
```

---

### Step 4: Setup Gateway Node.js

```bash
# Buka terminal baru, masuk ke direktori gateway
cd gateway

# Install dependencies
npm install

# Copy file environment
cp .env.example .env
```

Edit file `gateway/.env`:

```env
# Server
GATEWAY_PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Upstream via 9router (gateway → 9router → llm-proxy → OpenRouter).
# Saat lokal pakai 127.0.0.1:20128. Di docker compose: http://9router:20128/api/v1.
UPSTREAM_API_URL=http://127.0.0.1:20128/api/v1
# Kosong = no-auth. Set kalau 9router mengaktifkan REQUIRE_API_KEY.
UPSTREAM_API_KEY=
UPSTREAM_DEFAULT_MODEL=anthropic/claude-opus-4.7

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:3000
```

Jalankan gateway:

```bash
# Jalankan gateway server
node src/index.js
# ✅ Gateway berjalan di http://localhost:3001
```

---

## 🐳 Opsi 2: Docker Compose

### Langkah-langkah

```bash
# 1. Copy file environment
cp .env.example .env
cp backend/.env.example backend/.env
cp gateway/.env.example gateway/.env
```

### 2. Edit `backend/.env` untuk Docker

```env
# Ubah DB_CONNECTION dan host ke nama service Docker
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=llmore
DB_USERNAME=llmore
DB_PASSWORD=secret

# Redis — gunakan nama service Docker
REDIS_HOST=redis
REDIS_PORT=6379

CACHE_STORE=redis
SESSION_DRIVER=redis

FRONTEND_URL=http://localhost:3000
```

### 3. Edit `gateway/.env` untuk Docker

```env
# Redis — gunakan nama service Docker
REDIS_HOST=redis
REDIS_PORT=6379
```

### 4. Build & Jalankan

```bash
# Build dan jalankan semua service
docker compose up --build -d

# Generate Laravel application key
docker compose exec backend php artisan key:generate

# Jalankan migrasi dan seeder
docker compose exec backend php artisan migrate --seed

# Cek status semua container
docker compose ps
```

### 5. Perintah Docker Berguna

```bash
# Lihat logs semua service
docker compose logs -f

# Lihat logs service tertentu
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f gateway

# Restart service tertentu
docker compose restart backend

# Stop semua service
docker compose down

# Stop dan hapus volumes (reset database)
docker compose down -v
```

> ⚠️ **Perbedaan Host: Docker vs Manual**
>
> | Konfigurasi    | Manual (lokal)  | Docker Compose  |
> |---------------|-----------------|-----------------|
> | `DB_HOST`     | `127.0.0.1`     | `postgres`      |
> | `REDIS_HOST`  | `127.0.0.1`     | `redis`         |
>
> Dalam Docker, container berkomunikasi menggunakan **nama service** (bukan `localhost`/`127.0.0.1`), karena setiap container memiliki network namespace tersendiri.

---

## 📄 Konfigurasi .env

### Daftar File Environment

| File                  | Komponen   | Keterangan                              |
|-----------------------|------------|----------------------------------------|
| `.env`                | Root       | Konfigurasi umum Docker Compose         |
| `backend/.env`        | Backend    | Konfigurasi Laravel                     |
| `gateway/.env`        | Gateway    | Konfigurasi Node.js Gateway             |
| `frontend/.env.local` | Frontend   | Konfigurasi Next.js                     |

### 📦 `backend/.env` — Contoh Lengkap

```env
APP_NAME=LLMora
APP_ENV=local
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_DEBUG=true
APP_URL=http://localhost:8000

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file
BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=llmore
DB_USERNAME=llmore
DB_PASSWORD=secret

# Session
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

# Cache
CACHE_STORE=redis

# Redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=log

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# Midtrans
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/v1/transactions
MIDTRANS_API_URL=https://api.sandbox.midtrans.com/v2
```

### 🤖 `gateway/.env` — Contoh Lengkap

```env
# Server
GATEWAY_PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Upstream via 9router (gateway → 9router → llm-proxy → OpenRouter)
UPSTREAM_API_URL=http://127.0.0.1:20128/api/v1
UPSTREAM_API_KEY=
UPSTREAM_DEFAULT_MODEL=anthropic/claude-opus-4.7

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:3000
```

### 🖥️ `frontend/.env.local` — Contoh Lengkap

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
```

---

## ✅ Verifikasi

### Cara Cek Semua Service Berjalan

```bash
# Cek Backend Laravel
curl -s http://localhost:8000/api/plans | head -c 200
# Harus mengembalikan JSON daftar plans

# Cek Frontend Next.js
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Harus mengembalikan 200

# Cek Gateway Health
curl -s http://localhost:3001/health
# Harus mengembalikan JSON status OK

# Cek Redis
redis-cli ping
# Harus mengembalikan PONG

# Cek PostgreSQL
psql -U llmore -d llmore -c "SELECT count(*) FROM plans;"
# Harus mengembalikan jumlah plans dari seeder
```

### 🌐 URL Service

| Service       | URL                                    | Keterangan                    |
|---------------|----------------------------------------|-------------------------------|
| 🖥️ Frontend   | http://localhost:3000                  | Halaman utama & dashboard     |
| ⚙️ Backend API | http://localhost:8000                  | Laravel API                   |
| 🤖 Gateway    | http://localhost:3001/health           | AI Gateway health check       |
| 🐘 PostgreSQL | `localhost:5432`                       | Database (via psql/pgAdmin)   |
| 🔴 Redis      | `localhost:6379`                       | Cache (via redis-cli)         |

---

## 🔐 Login Akun

Setelah menjalankan `php artisan db:seed`, akun berikut tersedia:

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | `admin@llmora.id`   | `password` |

### Akses Dashboard

```
📊 Dashboard User  : http://localhost:3000/dashboard
🛡️ Admin Panel     : http://localhost:3000/dashboard/admin
```

> 💡 Login melalui http://localhost:3000/login menggunakan email dan password di atas.

---

## ⏰ Scheduled Commands

Untuk fitur lengkap, beberapa command perlu dijalankan secara berkala:

### Menjalankan Scheduler

```bash
# Opsi 1: Jalankan sekali (untuk testing)
cd backend
php artisan schedule:run

# Opsi 2: Jalankan terus-menerus (recommended untuk development)
cd backend
php artisan schedule:work
```

### Daftar Scheduled Commands

| Command                            | Interval      | Keterangan                                        |
|------------------------------------|---------------|--------------------------------------------------|
| `quota:sync`                       | Setiap 5 menit | Sinkronisasi kuota user berdasarkan subscription |
| `apikey:cache-refresh`             | Setiap 1 jam   | Refresh cache API key di Redis                   |
| `usage:process --batch=500`        | Setiap 1 menit | Proses usage logs dalam batch                    |

### Menjalankan Command Secara Manual

```bash
cd backend

# Sync kuota
php artisan quota:sync

# Refresh API key cache
php artisan apikey:cache-refresh

# Proses usage logs
php artisan usage:process --batch=500
```

---

## 🔧 Troubleshooting

### ❌ Redis Connection Refused

```
Error: Redis connection refused (ECONNREFUSED 127.0.0.1:6379)
```

**Solusi:**
```bash
# Pastikan Redis berjalan
brew services start redis
# atau
redis-server --daemonize yes

# Verifikasi
redis-cli ping  # Harus PONG
```

---

### ❌ PostgreSQL Authentication Failed

```
SQLSTATE[08006] FATAL: password authentication failed for user "llmore"
```

**Solusi:**
```bash
# Cek user exists
psql postgres -c "\\du" | grep llmore

# Reset password jika perlu
psql postgres -c "ALTER USER llmore WITH PASSWORD 'secret';"

# Pastikan database exists
psql postgres -c "\\l" | grep llmore

# Cek konfigurasi .env
cat backend/.env | grep DB_
```

---

### ❌ CORS Error di Browser

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solusi:**
1. Pastikan `FRONTEND_URL` di `backend/.env` sesuai:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
2. Pastikan `FRONTEND_URL` di `gateway/.env` sesuai:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
3. Restart backend setelah mengubah `.env`:
   ```bash
   # Stop server (Ctrl+C) lalu jalankan ulang
   php artisan serve
   ```

---

### ❌ 401 Unauthorized pada API Request

```
{ "message": "Unauthenticated." }
```

**Solusi:**
1. Pastikan sudah login dan token tersimpan di `localStorage`
2. Buka DevTools browser → Application → Local Storage → cek key `auth-storage`
3. Jika token expired, login ulang
4. Pastikan backend berjalan di port 8000

---

### ❌ Port Sudah Dipakai

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solusi:**
```bash
# Cari process yang menggunakan port
lsof -ti :3000  # untuk port 3000
lsof -ti :8000  # untuk port 8000
lsof -ti :3001  # untuk port 3001

# Kill process
kill -9 $(lsof -ti :3000)

# Atau gunakan port alternatif
# Frontend
PORT=3002 npm run dev

# Backend
php artisan serve --port=8001

# Gateway (ubah GATEWAY_PORT di gateway/.env)
```

---

### ❌ PHP Extension Tidak Ditemukan

```
PHP Fatal error: Uncaught Error: Class "Redis" not found
```

**Solusi:**
```bash
# Install ekstensi Redis untuk PHP
pecl install redis

# Verifikasi
php -m | grep redis

# Jika pdo_pgsql tidak ada
# Di macOS dengan Homebrew, biasanya sudah include
php -m | grep pdo_pgsql
```

---

### ❌ Migration Error — Table Already Exists

```
SQLSTATE[42P07]: Duplicate table
```

**Solusi:**
```bash
# Fresh migration (⚠️ hapus semua data)
php artisan migrate:fresh --seed
```

---

## 📝 Catatan Penting

### 💳 Midtrans Sandbox Mode
- Gunakan **Sandbox keys** untuk development, bukan Production keys
- URL Sandbox: `https://app.sandbox.midtrans.com`
- Nomor kartu testing: `4811 1111 1111 1114`
- Transaksi di sandbox mode tidak dikenakan biaya

### 🔐 Google OAuth Redirect URL
- Redirect URL **harus sama persis** antara konfigurasi Google Console dan `backend/.env`
- Untuk development lokal: `http://localhost:8000/api/auth/google/callback`
- Jangan gunakan `127.0.0.1` jika di Google Console menggunakan `localhost` (atau sebaliknya)

### 🤖 Gateway & AI Request
- Gateway **membutuhkan Redis** yang berjalan untuk rate limiting dan caching
- Gateway **membutuhkan 9router (port 20128) dan service `llm-proxy` berjalan** untuk memproses AI request
- 9router butuh provider `llm-proxy` didaftarkan manual di dashboard `http://localhost:20128/dashboard` (login pakai `INITIAL_PASSWORD` dari `9router/.env`)
- Service `llm-proxy` butuh minimal 1 OpenRouter API key aktif di `llm-proxy-vps/.env` atau di `data/keys.json`
- Tanpa key OpenRouter yang valid, endpoint `/chat/completions` akan mengembalikan error 402/503

### 🖥️ Frontend Standalone
- Frontend **bisa berjalan tanpa backend** — tampilan UI tetap muncul
- Namun fitur login, dashboard, dan data tidak akan berfungsi tanpa backend
- Ini berguna untuk development UI/UX tanpa harus menjalankan seluruh stack

### 🔄 Development Workflow yang Disarankan

```bash
# Terminal 1 — Backend
cd backend && php artisan serve

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Gateway
cd gateway && node src/index.js

# Terminal 4 — Scheduler (opsional)
cd backend && php artisan schedule:work
```

---

## 📚 Referensi Cepat

```bash
# ===== QUICK START (copy-paste semua) =====

# 1. Setup Database
psql postgres -c "CREATE USER llmore WITH PASSWORD 'secret' CREATEDB;"
psql postgres -c "CREATE DATABASE llmore OWNER llmore;"

# 2. Backend
cd backend
composer install
cp .env.example .env
# ⚠️ Edit backend/.env — ubah DB_CONNECTION ke pgsql, set credentials
php artisan key:generate
php artisan migrate --seed
php artisan serve &

# 3. Frontend
cd ../frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api' > .env.local
echo 'NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001' >> .env.local
npm run dev &

# 4. Gateway
cd ../gateway
npm install
cp .env.example .env
node src/index.js &

# ✅ Buka http://localhost:3000
# 🔐 Login: admin@llmora.id / password
```

---

> 📖 **LLMora.id** — AI Gateway Platform untuk developer Indonesia 🇮🇩
