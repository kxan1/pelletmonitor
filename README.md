# EyeSP32 — Chicken Feeder Monitoring Dashboard

Real-time monitoring dashboard for an ESP32-based automated chicken feed
pellet dispenser. Reads existing Blynk telemetry (unmodified ESP32 firmware),
logs it to PostgreSQL, and serves a public dashboard with live view,
historical charts, CSV export, and an admin panel.

## Project structure
```
EyeSP32/
├── backend/          FastAPI + PostgreSQL + Blynk bridge — see backend/README.md
├── frontend/         React + Vite dashboard — see frontend/README.md
├── .gitignore        Protects secrets & build artifacts (see below)
└── README.md         You are here
```

## Quick start
Two things need to run simultaneously, in separate terminals:

```cmd
:: Terminal 1 — backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

:: Terminal 2 — bridge (pulls data from Blynk into your DB)
cd backend
venv\Scripts\activate
python blynk_bridge.py

:: Terminal 3 — frontend
cd frontend
npm run dev
```
Full setup instructions (installing dependencies, first-time config) are in
`backend/README.md` and `frontend/README.md`.

## Environment variables reference

| Variable | Where | What it's for |
|---|---|---|
| `DATABASE_URL` | backend/.env | Postgres connection string (Neon, Railway, etc.) |
| `JWT_SECRET_KEY` | backend/.env | Signs admin login tokens. Random string, never shared. |
| `INGEST_API_KEY` | backend/.env | Shared secret between backend and blynk_bridge.py. See below. |
| `BLYNK_AUTH_TOKEN` | backend/.env | Your ESP32's Blynk device token |
| `BLYNK_VPIN_*` | backend/.env | Which Blynk vPins map to voltage/current/power/battery |
| `DEFAULT_ADMIN_EMAIL` / `_PASSWORD` | backend/.env | Seeds your first admin login on first boot only |
| `VITE_API_BASE_URL` | frontend/.env | URL of your backend, so the dashboard knows where to fetch data from |

## What is the ingest key?

`INGEST_API_KEY` is a shared secret between your own backend and your own
`blynk_bridge.py` script — nothing to do with Blynk or the ESP32 itself.
It exists so that once your backend is publicly reachable on the internet,
random strangers can't POST fake data into your database through `/ingest`.
The bridge script sends it as a header on every request; the backend rejects
anything that doesn't match.

You need exactly one, shared across all your ESP32 devices — it's not
per-device. Device identity is handled separately by `device_id` in the
payload (e.g. `esp32-feeder-01`, `esp32-feeder-02`), which needs no secret.

Generating a good one (32+ random hex characters is plenty):
```cmd
python -c "import secrets; print(secrets.token_hex(32))"
```
Paste the result as `INGEST_API_KEY` in `backend/.env`. Use a different
value for production than the one you use locally — see Deployment below.

## Setting up .gitignore properly

`.gitignore` tells Git which files to never track — this is how `.env`
(containing your real database password, JWT secret, ingest key, and Blynk
token) stays off GitHub while `.env.example` (placeholder values only) does
get committed.

**If you haven't initialized Git yet**, the `.gitignore` in this folder
already covers you — just run:
```cmd
git init
git add .
git commit -m "Initial commit"
```
Since `.env` is listed in `.gitignore` before your first `git add .`, Git
will skip it automatically. Confirm with:
```cmd
git status
```
You should NOT see `backend/.env` or `frontend/.env` listed as files to be
committed — only `.env.example` in each folder.

**If you already committed `.env` before adding .gitignore** (easy to check:
search your GitHub repo for the filename), `.gitignore` alone won't remove
something Git is already tracking. You need to explicitly untrack it:
```cmd
git rm --cached backend/.env
git rm --cached frontend/.env
git commit -m "Remove secrets from version control"
git push
```
This removes the file from future commits (your local copy on disk is
untouched — only Git stops tracking it). Important: the secret still exists
in your repo's history even after this. If it was ever pushed to a public
GitHub repo, treat every credential in it as compromised and rotate all of
them (new Postgres password, new JWT secret, new ingest key, new Blynk
token) — the same way we did earlier in this project when a real `.env`
got pasted into chat.

## Deployment

### 1. Database — Neon (already set up)
No changes needed if you're already using Neon; just confirm you're using
your production connection string, separate from any local dev database if
you decide to keep one.

### 2. Backend — Railway or Render (not Vercel)
Vercel's Python support is serverless-only (short-lived function calls) and
can't run a persistent WebSocket or a long-running polling script — both of
which this project needs. Railway or Render run real, always-on processes
and both have free/student tiers.

Steps (Railway shown, Render is nearly identical):
1. Push your code to GitHub first (see .gitignore section above).
2. In Railway: New Project → Deploy from GitHub repo → select `backend/` as
   the root directory.
3. Add all the backend/.env variables under Railway's "Variables" tab — do
   not upload the .env file itself, type the values directly into Railway's
   dashboard. Generate a fresh INGEST_API_KEY and JWT_SECRET_KEY for
   production (don't reuse your local dev ones).
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add a second service in the same Railway project for the bridge script —
   same repo, same root directory, start command: `python blynk_bridge.py`.
   This needs the same environment variables as the backend (Railway lets
   you share a variable group across services).
6. Once deployed, Railway gives you a public URL like
   `https://your-app.up.railway.app` — this is your production backend URL.

### 3. Frontend — Vercel
1. In Vercel: New Project → import the same GitHub repo → set the root
   directory to `frontend/`.
2. Add environment variable VITE_API_BASE_URL = your Railway backend URL
   from step 2.6 above.
3. Deploy. Vercel auto-detects Vite and handles the build.

### 4. Lock down CORS (do this after deployment works)
`backend/app/main.py` currently has:
```python
allow_origins=["*"]
```
This allows any website to call your API — fine for local development, not
ideal once it's public. Once you have your real Vercel URL, change it to:
```python
allow_origins=["https://your-app.vercel.app"]
```
and redeploy the backend.

### 5. Post-deployment checklist
- [ ] Fresh INGEST_API_KEY and JWT_SECRET_KEY set in Railway/Render (not reused from local dev)
- [ ] Logged in with DEFAULT_ADMIN_EMAIL/_PASSWORD once, then changed the password
- [ ] CORS restricted to your real Vercel domain
- [ ] Confirmed /status shows ONLINE once the deployed bridge is running
- [ ] .env is NOT visible anywhere in your GitHub repo (check the repo's file list on github.com directly)
