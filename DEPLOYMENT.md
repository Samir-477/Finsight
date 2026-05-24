# FinSight — Complete Deployment Guide
> Deploy backend on Render.com + frontend on Vercel (both free tier)

---

## What Was Fixed For Deployment

| Bug | File | Fix Applied |
|-----|------|-------------|
| Hardcoded `localhost:8000` in chart URLs | `Finsight/api/main.py` | Now reads `BACKEND_PUBLIC_URL` env var |
| CORS wildcard ignored settings | `Finsight/api/main.py` | Now reads `CORS_ORIGINS` env var |
| Backend import required all API keys | `Finsight/config/settings.py`, `Finsight/api/main.py` | API app now imports safely for platform health checks; pipeline still validates keys when a job runs |
| Python startup syntax failures | `deep_search.py`, `unified_llm_client.py`, `chart_generator.py` | Fixed invalid string stripping, token budget reset syntax, and `from __future__` import order |
| `next.config.mjs` blocked prod image domains | `Finsight/frontend/next.config.mjs` | Now allows any HTTPS domain |
| Frontend demo polish | `Finsight/frontend/app`, `components`, `globals.css` | Added animated glass UI, route transitions, responsive top bar, and premium report/progress surfaces |
| No deployment config files | — | Added `render.yaml`, `Procfile`, `vercel.json` |
| No frontend env var docs | — | Added `Finsight/frontend/.env.example` |

---

## Prerequisites

- GitHub account (push your code here first)
- [Render.com](https://render.com) account (free)
- [Vercel.com](https://vercel.com) account (free)
- Your API keys ready:
  - **Groq**: https://console.groq.com (free, no credit card)
  - **Google AI Studio (Gemini)**: https://aistudio.google.com (free)
  - **Serper**: https://serper.dev (2,500 free searches)
  - **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html (free)
  - **SEC**: just your email address

---

## Step 1 — Push to GitHub

```bash
cd /path/to/your/project  # the folder containing Finsight/ folder
git init
git add .
git commit -m "Initial commit — FinSight AI Research Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/finsight.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render.com

### 2a. Create Web Service

1. Go to https://render.com → Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `finsight-backend`
   - **Root Directory**: `.` (leave blank / root)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r Finsight/requirements.txt`
   - **Start Command**: `uvicorn Finsight.api.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 2b. Set Environment Variables

In Render dashboard → your service → **Environment** → Add:

```
DS_MODEL_NAME        = llama-3.3-70b-versatile
DS_API_KEY           = your_groq_api_key
DS_BASE_URL          = https://api.groq.com/openai/v1

WRITER_MODEL_NAME    = llama-3.3-70b-versatile
WRITER_API_KEY       = your_groq_api_key
WRITER_BASE_URL      = https://api.groq.com/openai/v1

VLM_MODEL_NAME       = gemini-2.5-flash
VLM_API_KEY          = your_gemini_api_key
VLM_BASE_URL         = https://generativelanguage.googleapis.com/v1beta/openai

EMBEDDING_MODEL_NAME = all-MiniLM-L6-v2

SERPER_API_KEY       = your_serper_api_key
SEC_USER_AGENT       = your@email.com
FRED_API_KEY         = your_fred_api_key

OUTPUT_DIR           = /tmp/finsight_outputs
CHECKPOINT_DIR       = /tmp/finsight_checkpoints
CORS_ORIGINS         = *
```

**Leave `BACKEND_PUBLIC_URL` blank for now** — you'll set it after deploy.

### 2c. Deploy & Get URL

- Click **Create Web Service** → wait ~5-10 minutes for build
- Note your URL: `https://finsight-backend-XXXX.onrender.com`

### 2d. Set BACKEND_PUBLIC_URL

Back in Render → Environment → Add:
```
BACKEND_PUBLIC_URL = https://finsight-backend-XXXX.onrender.com
```
(Use your actual URL from step 2c)

Then click **Manual Deploy** → **Deploy latest commit**

### 2e. Verify Backend

Visit `https://finsight-backend-XXXX.onrender.com/docs` — you should see the FastAPI swagger UI.

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Create Project

1. Go to https://vercel.com → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `Finsight/frontend`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)

### 3b. Set Environment Variables

In Vercel → your project → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://finsight-backend-XXXX.onrender.com
NEXT_PUBLIC_WS_URL  = wss://finsight-backend-XXXX.onrender.com
```

> ⚠️ Note `wss://` (WebSocket Secure) for production — not `ws://`

### 3c. Deploy

Click **Deploy** → wait ~2-3 minutes.

Your frontend URL: `https://finsight-XXXX.vercel.app`

---

## Step 4 — Final CORS Update

Now that you have your Vercel frontend URL, update the Render backend:

In Render → Environment:
```
CORS_ORIGINS = https://finsight-XXXX.vercel.app
```

Redeploy the backend.

---

## Running Locally (Development)

### Backend

```bash
# From the repo root (where Finsight/ folder lives)
cp Finsight/.env.example Finsight/.env
# Edit Finsight/.env with your API keys

pip install -r Finsight/requirements.txt
uvicorn Finsight.api.main:app --reload --port 8000
```

### Frontend

```bash
cd Finsight/frontend
cp .env.example .env.local
# .env.local already points to localhost:8000

npm install
npm run dev
# Open http://localhost:3000
```

---

## Troubleshooting

### Charts not showing in report
- Make sure `BACKEND_PUBLIC_URL` is set correctly in Render (no trailing slash)
- Verify the backend URL is reachable from your browser
- Check browser Network tab for failed image requests

### WebSocket not connecting
- Render free tier may spin down after 15 min of inactivity → first request takes ~30s to wake up
- Use `wss://` (not `ws://`) for Vercel → Render connections

### "Missing required environment variables" error when starting a research job
- The API can boot without keys for health checks, but the research pipeline still needs them.
- Check all env vars are set in Render: DS_API_KEY, WRITER_API_KEY, VLM_API_KEY, SERPER_API_KEY, SEC_USER_AGENT, FRED_API_KEY

### Groq rate limits during report generation
- Pipeline has automatic fallback: Gemini → llama-3.3-70b → llama-3.1-8b → template
- Template fallback always works with zero LLM calls

### Render free tier limitations
- 512MB RAM — may be tight with sentence-transformers loaded
- If OOM: The `sentence-transformers` model is lazy-loaded, so it only loads if embeddings are used
- Alternative: Use Render Starter plan ($7/mo) for 512MB → 1GB RAM

---

## Directory Structure Reference

```
repo-root/
├── Finsight/               ← Python backend package
│   ├── api/main.py         ← FastAPI app (fixed for deployment)
│   ├── config/settings.py  ← Reads .env file
│   ├── pipeline/           ← 6-stage AI pipeline
│   ├── agents/             ← Data, search, perspective agents
│   ├── writing/            ← Report writer
│   ├── visualization/      ← 6 matplotlib charts
│   ├── tools/              ← LLM, search, data clients
│   ├── requirements.txt    ← Python dependencies
│   ├── .env.example        ← Backend env template
│   └── frontend/           ← Next.js app
│       ├── app/page.tsx    ← Main UI (improved)
│       ├── components/     ← ReportViewer, ProgressTracker (improved)
│       ├── lib/            ← API client (uses NEXT_PUBLIC_API_URL)
│       ├── .env.example    ← Frontend env template
│       ├── vercel.json     ← Vercel deployment config
│       └── next.config.mjs ← Updated for prod image domains
├── render.yaml             ← Render.com deployment config
├── Procfile                ← Process file (Render/Heroku)
└── DEPLOYMENT.md           ← This file
```
