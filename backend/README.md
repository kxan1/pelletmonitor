# Chicken Feeder Dashboard — Backend (Step 1)

This is the FastAPI + PostgreSQL backend, plus the Blynk bridge that pulls
data from your existing, unchanged ESP32 → Blynk setup into your own database.

## What this step gives you
- A running FastAPI server with endpoints for ingest, live/range readings,
  stats, online/offline status, CRUD, and vPin config.
- A bridge script that polls Blynk and writes into Postgres — your ESP32
  firmware and Blynk app are NOT modified.

## 1. Install PostgreSQL (skip if you already have one)
Easiest for a student project: use a free hosted Postgres so you don't
fight local install issues:
- https://neon.tech (free tier, serverless Postgres) — recommended
- or https://railway.app / https://render.com managed Postgres

Copy the connection string they give you (starts with `postgresql://`).

## 2. Set up the Python environment
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` → paste your Postgres connection string
- `INGEST_API_KEY` → make up a random string, e.g. `openssl rand -hex 16`
- `JWT_SECRET_KEY` → another random string
- `BLYNK_AUTH_TOKEN` → from your Blynk device (Device Info tab)
- `BLYNK_VPIN_VOLTAGE` / `_CURRENT` / `_POWER` / `_BATTERY` → the exact
  virtual pins your ESP32 sketch already writes to (check your `.ino` file
  for `Blynk.virtualWrite(V0, ...)` etc.)

## 4. Run the API
```bash
uvicorn app.main:app --reload
```
Visit http://localhost:8000/docs — FastAPI's auto-generated Swagger UI.
Tables are created automatically on first run.

## 5. Run the Blynk bridge (separate terminal, same venv)
```bash
python blynk_bridge.py
```
You should see log lines like:
```
Pushed reading: {'voltage': 12.6, 'current': 1.4, 'power': 17.6, 'battery_pct': 88.0, ...}
```

## 6. Verify data is flowing
- http://localhost:8000/readings/latest → should show your most recent reading
- http://localhost:8000/readings?range=1h → should show a growing array
- http://localhost:8000/status → `"online": true` while the bridge is running

## Next step
Once you confirm real data is landing in Postgres, we'll build the React
dashboard (live cards + time-range charts) that reads from these endpoints.
