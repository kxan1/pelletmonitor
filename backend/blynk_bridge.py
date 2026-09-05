"""
blynk_bridge.py
----------------
Polls your EXISTING Blynk device (unchanged ESP32 firmware) via Blynk's
HTTP API and forwards each reading into your own FastAPI /ingest endpoint.

Pulls the list of parameters to poll from GET /metrics on your own backend —
so if you add a new key (e.g. "temperature") through the admin UI, this
script picks it up automatically on its next refresh, no code changes.

Run as a long-lived process:
    python blynk_bridge.py
"""
import time
import logging

import requests
from dotenv import load_dotenv

from app.config import settings

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("blynk_bridge")

CORE_KEYS = {"voltage", "current", "power", "battery_pct"}
METRICS_REFRESH_EVERY = 30  # re-check for newly added custom keys every N poll cycles


def fetch_metric_definitions() -> list[dict]:
    """Asks our own backend which keys exist right now (core + custom)."""
    resp = requests.get(f"{settings.ingest_url.rsplit('/ingest', 1)[0]}/metrics", timeout=10)
    resp.raise_for_status()
    return resp.json()


def fetch_blynk_values(metrics: list[dict]) -> dict:
    params = {"token": settings.blynk_auth_token}
    for m in metrics:
        params[m["vpin"].lower()] = ""

    resp = requests.get(f"{settings.blynk_server}/external/api/get", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    core, custom = {}, {}
    for m in metrics:
        raw = data.get(m["vpin"].lower())
        value = float(raw) if raw not in (None, "") else None
        if m["key"] in CORE_KEYS:
            core[m["key"]] = value
        elif value is not None:
            custom[m["key"]] = value
    return core, custom


def push_to_backend(core: dict, custom: dict):
    payload = {**core, "custom_metrics": custom or None, "device_id": "esp32-feeder-01"}
    headers = {"X-Ingest-Key": settings.ingest_api_key}
    resp = requests.post(settings.ingest_url, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    log.info("Pushed reading: %s", payload)


def main():
    log.info("Starting Blynk bridge, polling every %ss", settings.poll_interval_seconds)
    metrics = fetch_metric_definitions()
    log.info("Tracking metrics: %s", [m["key"] for m in metrics])
    cycle = 0

    while True:
        try:
            if cycle % METRICS_REFRESH_EVERY == 0:
                metrics = fetch_metric_definitions()
            core, custom = fetch_blynk_values(metrics)
            push_to_backend(core, custom)
        except Exception as e:
            log.error("Bridge cycle failed: %s", e)
        cycle += 1
        time.sleep(settings.poll_interval_seconds)


if __name__ == "__main__":
    main()
