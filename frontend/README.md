# Chicken Feeder Dashboard — Frontend (Step 2)

React + Vite dashboard reading from your FastAPI backend. Responsive
down to mobile (test by shrinking your browser or using DevTools device mode).

## 1. Install Node.js
If you don't have it: https://nodejs.org (LTS version). Confirm with:
```bash
node -v
npm -v
```

## 2. Install dependencies
```bash
cd frontend
npm install
```

## 3. Configure the API URL
```bash
cp .env.example .env
```
Leave `VITE_API_BASE_URL=http://localhost:8000` for now (your local backend).

## 4. Run it
```bash
npm run dev
```
Open the URL it prints (usually http://localhost:5173).

## What you should see
- Top bar: device name + an ONLINE/OFFLINE badge (green dot = your
  Blynk bridge has pushed data in the last ~15s).
- 4 live readout panels (Voltage/Current/Power/Battery), updating every 4s.
- A chart with time-range tabs (LIVE/3M/5M/1H/3H/1D/1WK) and a parameter
  dropdown (Voltage/Current/Power/Battery).
- An "Export CSV" button — downloads the currently selected range/parameter's
  data as CSV (opens directly in OriginPro or Power BI's "Get Data > Text/CSV").
- Min/Avg/Max stats footer (Voltage, Current, Power only — battery excluded
  per spec, since min/avg/max isn't meaningful for a percentage state-of-charge).

## Important: run this WITH your backend running
This dashboard has no built-in mock data — it calls your FastAPI backend
directly. Before running `npm run dev`, make sure in another terminal:
```bash
uvicorn app.main:app --reload      # from backend/
python blynk_bridge.py              # from backend/, separate terminal
```
If you see "Could not reach the backend API" in red at the top of the page,
that's your signal to check the backend terminal for errors first.

## Next steps (not built yet)
- CRUD screen for admin (edit/delete individual logged readings)
- vPin config screen (admin-only, remaps which Blynk vPin feeds which parameter)
- Login/auth split between admin and public read-only view
- Gemini-powered "explain this trend" panel
