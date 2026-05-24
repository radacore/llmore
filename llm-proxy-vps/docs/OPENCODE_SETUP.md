# Setup OpenCode + Oh-My-OpenAgent (omo) lewat LLM Proxy Router

Panduan ini menyambungkan **opencode** + plugin **oh-my-openagent** ke proxy lokal
Anda (`http://127.0.0.1:9898`) yang sudah punya pool 10 key OpenRouter.
Model dipilih untuk memaksimalkan nilai **$1 trial credit per key** dengan
"overpower Anthropic" (Opus 4.6 / 4.7 + Sonnet 4.6 utk fallback).

---

## 1. Peta Model Anthropic di OpenRouter (per 1M token)

Diambil langsung dari `https://openrouter.ai/api/v1/models` (snapshot 2026-05).

| Model | Context | Max out | Input | Output | Tools | Catatan |
|---|---:|---:|---:|---:|:---:|---|
| [`anthropic/claude-opus-4.7`](https://openrouter.ai/anthropic/claude-opus-4.7) | **1M** | 128k | $5 | $25 | ✅ | **Top pick.** Default Sisyphus di omo. |
| [`anthropic/claude-opus-4.6`](https://openrouter.ai/anthropic/claude-opus-4.6) | **1M** | 128k | $5 | $25 | ✅ | Generasi sebelumnya, harga sama. Cadangan. |
| [`anthropic/claude-opus-4.6-fast`](https://openrouter.ai/anthropic/claude-opus-4.6-fast) | 1M | 128k | $30 | $150 | ✅ | ⚠️ **6× lebih mahal**. **Hindari** untuk $1 budget. |
| [`anthropic/claude-opus-4.5`](https://openrouter.ai/anthropic/claude-opus-4.5) | 200k | 64k | $5 | $25 | ✅ | Kalau butuh stabil/legacy. |
| [`anthropic/claude-opus-4.1`](https://openrouter.ai/anthropic/claude-opus-4.1) | 200k | 32k | $15 | $75 | ✅ | ⚠️ Mahal, jangan dipakai. |
| [`anthropic/claude-opus-4`](https://openrouter.ai/anthropic/claude-opus-4) | 200k | 32k | $15 | $75 | ✅ | ⚠️ Mahal, jangan dipakai. |
| [`anthropic/claude-sonnet-4.6`](https://openrouter.ai/anthropic/claude-sonnet-4.6) | 1M | 128k | $3 | $15 | ✅ | **Pilihan terbaik untuk Sonnet** (1M ctx, output tinggi). |
| [`anthropic/claude-sonnet-4.5`](https://openrouter.ai/anthropic/claude-sonnet-4.5) | 1M | 64k | $3 | $15 | ✅ | Alternatif. |
| [`anthropic/claude-haiku-4.5`](https://openrouter.ai/anthropic/claude-haiku-4.5) | 200k | 64k | $1 | $5 | ✅ | **Utility / Explore / Librarian.** Murah + cepat. |
| [`anthropic/claude-3.5-haiku`](https://openrouter.ai/anthropic/claude-3.5-haiku) | 200k | 8k | $0.80 | $4 | ✅ | Cadangan paling murah. |

> **Catatan harga vs $1 trial**: dengan Opus 4.7 ($5/$25), 1 key bertahan untuk
> ~200k token input / ~40k token output saja. Karena itu pool 10 key paralel di
> proxy Anda × failover otomatis = total efektif ~10× kapasitas.

---

## 2. Strategi Pemilihan Model (sesuai kebutuhan + budget $1/key)

| Agent omo | Tugas | Model proxy (rekomendasi) | Alasan |
|---|---|---|---|
| **Sisyphus** | Main orchestrator | `anthropic/claude-opus-4.7` | Dual-prompt utama omo, butuh kualitas Opus. |
| **Prometheus** | Strategic planner | `anthropic/claude-opus-4.7` | Interview-mode, kompleks. |
| **Metis** | Plan reviewer | `anthropic/claude-sonnet-4.6` | Cukup pintar, hemat 5× vs Opus. |
| **Atlas** | Todo orchestrator | `anthropic/claude-sonnet-4.6` | Kerja terstruktur, ringan. |
| **Oracle** | Architecture/debug | `anthropic/claude-opus-4.7` | Butuh reasoning tinggi. |
| **Momus** | Reviewer presisi | `anthropic/claude-opus-4.7` | Butuh akurasi tinggi. |
| **Hephaestus** | Deep autonomous worker | `anthropic/claude-opus-4.7` | Sebenarnya GPT-native, tapi via proxy hanya Anthropic — Opus 4.7 fallback paling dekat. |
| **Explore** | Fast grep/search | `anthropic/claude-haiku-4.5` | **Wajib murah**. Speed > intelligence. |
| **Librarian** | Doc retrieval | `anthropic/claude-haiku-4.5` | Idem. Hindari Opus di sini. |
| **Multimodal-Looker** | Vision/screenshot | `anthropic/claude-sonnet-4.6` | Sonnet 4.6 sudah multimodal. |
| **visual-engineering** | Frontend/UI | `anthropic/claude-sonnet-4.6` | Cukup capable, hemat budget. |
| **quick** | Single-file edits | `anthropic/claude-haiku-4.5` | Trivial → murah. |
| **deep** | Riset+eksekusi panjang | `anthropic/claude-opus-4.7` | Butuh Opus. |
| **ultrabrain** | Hard logic | `anthropic/claude-opus-4.7` | Butuh Opus. |

---

## 3. Konfigurasi Proxy (`.env`)

Edit [`.env`](../.env:1) supaya cocok untuk traffic opencode + omo (banyak
sub-agent paralel):

```ini
# Inti
HOST=127.0.0.1
PORT=9898
DEFAULT_MODEL=anthropic/claude-opus-4.7

# Pool 10 key × 4 concurrent = 40 in-flight max
POOL_SIZE=10
PER_KEY_CONCURRENCY=4
LOAD_BALANCE_STRATEGY=least_inflight
ACQUIRE_TIMEOUT=30
AGENT_AFFINITY=true        # WAJIB true — supaya prompt-cache OpenRouter aktif

# Cap tokens — Opus output mahal, batasi default 32k
AUTO_MAX_TOKENS_CAP=32000
CREDIT_TO_TOKENS_RATIO=50000
MIN_CREDIT_USD=0.05

# Auth proxy (rekomendasi: pasang token agar omo/opencode wajib pakai key ini)
PROXY_API_KEY=sk-local-CHANGEME-32chars
```

Restart proxy:

```bash
python run.py --mode server
```

Cek dashboard: <http://127.0.0.1:9898/> (status pool, credit per key, in-flight).

---

## 4. Install opencode + oh-my-openagent

### 4.1 opencode

Windows (PowerShell):

```powershell
irm https://opencode.ai/install.ps1 | iex
```

macOS/Linux:

```bash
curl -fsSL https://opencode.ai/install.sh | bash
```

Verifikasi: `opencode --version` (butuh ≥ 1.0.150 untuk omo).

### 4.2 oh-my-openagent (omo)

Butuh **bun** sekali untuk installer-nya (CLI binary akan standalone setelahnya):

```bash
# install bun (Windows)
powershell -c "irm bun.sh/install.ps1 | iex"

# jalankan installer omo non-interaktif
# karena kita TIDAK punya subscription native, semua dijawab "no"
# omo akan jatuh ke fallback chain → kita arahkan ke proxy via opencode.json
bunx oh-my-openagent install --no-tui ^
  --claude=no --openai=no --gemini=no --copilot=no ^
  --opencode-zen=no --zai-coding-plan=no --opencode-go=no ^
  --kimi-for-coding=no --vercel-ai-gateway=no --skip-auth
```

> Flag `--skip-auth` penting: kita pakai proxy lokal sebagai provider, bukan
> OAuth langsung ke Anthropic.

Verifikasi:

```bash
bunx oh-my-openagent doctor
opencode --version
```

---

## 5. Konfigurasi opencode → arahkan ke proxy

opencode mendukung **OpenAI-compatible custom provider**. Kita daftarkan proxy
sebagai provider dengan id `local-proxy`, lalu omo akan memakai model dari
provider itu.

### 5.1 `~/.config/opencode/opencode.json`

(Windows: `%USERPROFILE%\.config\opencode\opencode.json`)

Lihat file siap-pakai [`config-templates/opencode.json`](../config-templates/opencode.json:1).

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-openagent"],
  "provider": {
    "local-proxy": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Local LLM Proxy Router",
      "options": {
        "baseURL": "http://127.0.0.1:9898/v1",
        "apiKey": "sk-local-CHANGEME-32chars"
      },
      "models": {
        "anthropic/claude-opus-4.7": {
          "name": "Claude Opus 4.7 (proxy)",
          "limit": { "context": 1000000, "output": 128000 },
          "cost":  { "input": 5, "output": 25 },
          "tools": true
        },
        "anthropic/claude-opus-4.6": {
          "name": "Claude Opus 4.6 (proxy)",
          "limit": { "context": 1000000, "output": 128000 },
          "cost":  { "input": 5, "output": 25 },
          "tools": true
        },
        "anthropic/claude-sonnet-4.6": {
          "name": "Claude Sonnet 4.6 (proxy)",
          "limit": { "context": 1000000, "output": 128000 },
          "cost":  { "input": 3, "output": 15 },
          "tools": true
        },
        "anthropic/claude-haiku-4.5": {
          "name": "Claude Haiku 4.5 (proxy)",
          "limit": { "context": 200000, "output": 64000 },
          "cost":  { "input": 1, "output": 5 },
          "tools": true
        }
      }
    }
  },
  "model": "local-proxy/anthropic/claude-opus-4.7"
}
```

### 5.2 `~/.config/opencode/oh-my-openagent.jsonc`

Override model per-agent supaya semua trafik omo lewat proxy. File siap pakai:
[`config-templates/oh-my-openagent.jsonc`](../config-templates/oh-my-openagent.jsonc:1).

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",

  // Mapping kategori → model (dipakai sub-agent generic)
  "categories": {
    "ultrabrain":         { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "deep":               { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "visual-engineering": { "model": "local-proxy/anthropic/claude-sonnet-4.6" },
    "quick":              { "model": "local-proxy/anthropic/claude-haiku-4.5" }
  },

  // Override eksplisit per-agent
  "agents": {
    "sisyphus":          { "model": "local-proxy/anthropic/claude-opus-4.7",
                           "fallback_models": [
                             "local-proxy/anthropic/claude-opus-4.6",
                             "local-proxy/anthropic/claude-sonnet-4.6"
                           ] },
    "prometheus":        { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "metis":             { "model": "local-proxy/anthropic/claude-sonnet-4.6" },
    "atlas":             { "model": "local-proxy/anthropic/claude-sonnet-4.6" },
    "oracle":            { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "momus":             { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "hephaestus":        { "model": "local-proxy/anthropic/claude-opus-4.7" },
    "explore":           { "model": "local-proxy/anthropic/claude-haiku-4.5" },
    "librarian":         { "model": "local-proxy/anthropic/claude-haiku-4.5" },
    "multimodal-looker": { "model": "local-proxy/anthropic/claude-sonnet-4.6" }
  },

  // Team Mode v4.0 — opt-in, hemat kalau hanya 1 user
  "team_mode": {
    "enabled": false,
    "max_parallel_members": 4,
    "tmux_visualization": true
  }
}
```

> `local-proxy/anthropic/claude-opus-4.7` artinya **provider** = `local-proxy`,
> **model id** = `anthropic/claude-opus-4.7`. opencode akan mengirim request ke
> `http://127.0.0.1:9898/v1/chat/completions` dengan `model:
> "anthropic/claude-opus-4.7"` — proxy lalu rotate ke 1 dari 10 key OpenRouter.

---

## 6. Verifikasi End-to-End

```bash
# 1) proxy nyala
curl http://127.0.0.1:9898/health

# 2) test request langsung (ganti BEARER dgn PROXY_API_KEY)
curl http://127.0.0.1:9898/v1/chat/completions ^
  -H "Authorization: Bearer sk-local-CHANGEME-32chars" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"anthropic/claude-opus-4.7\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":50}"

# 3) test dari opencode
opencode run "Halo, sebut model yang sedang kamu pakai."

# 4) test dengan omo ultrawork
opencode
> ultrawork tolong refactor file foo.py supaya lebih bersih
```

Pantau dashboard proxy — Anda harusnya melihat `in_flight` naik per key dan
credit menurun.

---

## 7. Tips Hemat $1/Key

1. **`AGENT_AFFINITY=true`** — request dari sub-agent yang sama dipin ke key
   yang sama → **prompt cache OpenRouter aktif** → diskon ~90% input token
   untuk konteks yang berulang.
2. **Jangan pakai Opus untuk Explore/Librarian** — itu pemborosan. Haiku 4.5
   25× lebih murah untuk hasil yang sama-sama bagus dalam grep.
3. **`AUTO_MAX_TOKENS_CAP=32000`** sudah dipasang — proxy auto-clamp `max_tokens`
   sesuai sisa credit (lihat [`Settings.safe_max_tokens`](../app/config.py:154)).
4. **Hindari `claude-opus-4.6-fast`** — 6× lipat harga normal Opus, $1 habis
   dalam beberapa request.
5. **Team Mode `enabled=false`** kalau Anda satu-satunya user — hemat ~4× token
   per task.
6. **Compact context sering** — di opencode tekan `/compact` saat sesi panjang.

---

## 8. Troubleshooting

| Gejala | Sebab | Fix |
|---|---|---|
| `401 Unauthorized` di opencode | `apiKey` di `opencode.json` ≠ `PROXY_API_KEY` di `.env` | samakan kedua nilai. |
| `503 no healthy keys` | Semua key habis credit / kena rate-limit | tunggu auto-trial atau tambah key manual lewat dashboard. |
| omo pakai model selain proxy | Plugin override tidak ke-load | pastikan `oh-my-openagent.jsonc` di `~/.config/opencode/` dan jalankan `bunx oh-my-openagent doctor`. |
| Stream macet | `HTTP_MAX_KEEPALIVE` < total in-flight | naikkan ke ≥ `POOL_SIZE × PER_KEY_CONCURRENCY × 2`. |
| `model not found` di opencode | Model id salah | gunakan **persis** `anthropic/claude-opus-4.7` (bukan `claude-opus-4-7`). |

---

## 9. File yang dihasilkan panduan ini

- [`docs/OPENCODE_SETUP.md`](OPENCODE_SETUP.md:1) — dokumen ini.
- [`config-templates/opencode.json`](../config-templates/opencode.json:1) — taruh di `~/.config/opencode/opencode.json`.
- [`config-templates/oh-my-openagent.jsonc`](../config-templates/oh-my-openagent.jsonc:1) — taruh di `~/.config/opencode/oh-my-openagent.jsonc`.
