# LLMore.id

**Platform AI Gateway #1 Indonesia** — Akses berbagai model AI premium melalui satu API gateway dengan pembayaran lokal.

![LLMore.id](https://img.shields.io/badge/LLMore-API%20Gateway-indigo)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Daftar Isi

- [Tentang](#tentang)
- [Arsitektur](#arsitektur)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Kontribusi](#kontribusi)

---

## Tentang

LLMore.id adalah platform API gateway yang menyediakan akses ke berbagai model AI dengan harga terjangkau untuk developer Indonesia. Fitur utama:

- 🚀 **API Kompatibel OpenAI** — Ganti `baseURL` saja, tanpa ubah kode
- 💳 **Pembayaran Lokal** — QRIS, bank transfer, e-wallet via Midtrans
- ⚡ **Streaming Real-time** — SSE streaming untuk response AI
- 🔑 **API Key Management** — Buat dan kelola multiple API keys
- 📊 **Usage Tracking** — Monitor pemakaian token secara real-time
- 🛡️ **Rate Limiting** — Proteksi dan kontrol per plan

---

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (port 80)                   │
│  llmore.id → Frontend    api.llmore.id → GW   │
└──────┬──────────────┬──────────────────┬─────────────┘
       │              │                  │
  ┌────▼────┐   ┌─────▼─────┐   ┌───────▼──────┐
  │ Next.js │   │  Laravel   │   │  Node.js     │
  │Frontend │   │  Backend   │   │  Gateway     │
  │ :3000   │   │  :8000     │   │  :3001       │
  └─────────┘   └─────┬──────┘   └──────┬───────┘
                      │                  │
              ┌───────▼──────────────────▼───────┐
              │     PostgreSQL  │     Redis       │
              │     :5432      │     :6379        │
              └────────────────┴─────────────────┘
```

| Service      | Teknologi       | Port | Deskripsi                          |
| ------------ | --------------- | ---- | ---------------------------------- |
| **Frontend** | Next.js 15      | 3000 | Dashboard & landing page           |
| **Backend**  | Laravel 12      | 8000 | REST API, auth, billing            |
| **Gateway**  | Node.js/Express | 3001 | AI proxy, streaming, rate limiting |
| **Database** | PostgreSQL 16   | 5432 | Data utama                         |
| **Cache**    | Redis 7         | 6379 | Caching, rate limit, session       |
| **Proxy**    | Nginx           | 80   | Reverse proxy & load balancer      |

---

## Prerequisites

- **Docker** v20+ & **Docker Compose** v2+
- (Manual) **Node.js** v20+
- (Manual) **PHP** 8.3+ & **Composer** v2+
- (Manual) **PostgreSQL** 16+
- (Manual) **Redis** 7+

---

## Quick Start (Docker)

```bash
# 1. Clone repository
git clone https://github.com/your-org/llmore.git
cd llmore

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp gateway/.env.example gateway/.env

# 3. Generate Laravel app key
cd backend && php artisan key:generate && cd ..
# Atau edit backend/.env secara manual: APP_KEY=base64:...

# 4. Jalankan semua services
docker compose up -d

# 5. Jalankan migration & seeder
docker exec llmore-backend php artisan migrate --seed

# 6. Akses aplikasi
# Frontend:  http://localhost
# Backend:   http://localhost/api
# Gateway:   http://localhost:3001
```

### Perintah Docker Berguna

```bash
# Lihat logs
docker compose logs -f

# Restart service tertentu
docker compose restart backend

# Rebuild setelah perubahan Dockerfile
docker compose up -d --build

# Stop semua services
docker compose down

# Stop & hapus volumes (reset database)
docker compose down -v
```

---

## Manual Setup

### 1. Database

```bash
# Buat database PostgreSQL
createdb llmore
```

### 2. Backend (Laravel)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local  # Jika ada
npm install
npm run dev
```

### 4. Gateway (Node.js)

```bash
cd gateway
cp .env.example .env
npm install
node src/index.js
```

---

## Environment Variables

Salin `.env.example` ke `.env` di root project dan isi nilai yang sesuai:

| Variable                         | Deskripsi                     | Default                    |
| -------------------------------- | ----------------------------- | -------------------------- |
| `DB_DATABASE`                    | Nama database PostgreSQL      | `llmore`                |
| `DB_USERNAME`                    | Username database             | `llmore`                |
| `DB_PASSWORD`                    | Password database             | `secret`                   |
| `REDIS_HOST`                     | Host Redis                    | `127.0.0.1`               |
| `GOOGLE_CLIENT_ID`               | Google OAuth Client ID        | —                          |
| `GOOGLE_CLIENT_SECRET`           | Google OAuth Client Secret    | —                          |
| `MIDTRANS_SERVER_KEY`            | Midtrans Server Key           | —                          |
| `MIDTRANS_CLIENT_KEY`            | Midtrans Client Key           | —                          |
| `ASKCODI_API_KEY`                | AskCodi API Key               | —                          |
| `NEXT_PUBLIC_API_URL`            | URL Backend API untuk frontend| `http://localhost:8000/api` |
| `NEXT_PUBLIC_GATEWAY_URL`        | URL Gateway untuk frontend    | `http://localhost:3001`    |
| `GATEWAY_PORT`                   | Port Gateway                  | `3001`                     |

> ⚠️ **Penting:** Untuk production, pastikan mengisi semua API key dan menggunakan password yang kuat.

---

## API Endpoints

### Backend API (`/api`)

| Method | Endpoint                          | Deskripsi                   |
| ------ | --------------------------------- | --------------------------- |
| POST   | `/api/auth/google`                | Login via Google OAuth      |
| POST   | `/api/auth/logout`                | Logout                      |
| GET    | `/api/user`                       | Get current user            |
| GET    | `/api/api-keys`                   | List API keys               |
| POST   | `/api/api-keys`                   | Create API key              |
| DELETE | `/api/api-keys/:id`               | Delete API key              |
| GET    | `/api/billing/plans`              | List subscription plans     |
| POST   | `/api/billing/subscribe`          | Create subscription         |
| POST   | `/api/billing/webhook/midtrans`   | Midtrans payment webhook    |
| GET    | `/api/usage`                      | Get usage statistics        |

### Gateway API (`api.llmore.id/v1`)

| Method | Endpoint               | Deskripsi                          |
| ------ | ---------------------- | ---------------------------------- |
| POST   | `/v1/chat/completions` | Chat completion (OpenAI-compatible)|
| GET    | `/v1/models`           | List available models              |
| GET    | `/v1/usage`            | Get API key usage                  |

> 📖 Dokumentasi API lengkap tersedia di halaman [/docs](http://localhost:3000/docs) pada frontend.

---

## Struktur Project

```
llmore/
├── backend/          # Laravel 12 — REST API
├── frontend/         # Next.js 15 — Dashboard & Landing
├── gateway/          # Node.js — AI API Gateway
├── docker/           # Dockerfile untuk setiap service
├── nginx/            # Nginx reverse proxy config
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi fitur"`
4. Push ke branch: `git push origin fitur/nama-fitur`
5. Buat Pull Request

### Konvensi Commit

- `feat:` — Fitur baru
- `fix:` — Bug fix
- `docs:` — Dokumentasi
- `refactor:` — Refactoring kode
- `test:` — Testing
- `chore:` — Maintenance

---

## Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE).

---

<p align="center">
  Dibuat dengan ❤️ untuk developer Indonesia<br/>
  <strong>LLMore.id</strong> — API AI Terjangkau
</p>
