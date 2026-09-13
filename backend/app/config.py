from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — one level up from this file (backend/app/config.py).
# This is for LOCAL DEV ONLY. On Railway/Render/production, there is no
# .env file — variables are injected directly into the environment, and
# pydantic-settings reads those automatically. So we only load .env if it
# actually exists; otherwise we just proceed and trust the real env vars.
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    ingest_api_key: str

    blynk_auth_token: str = ""
    blynk_server: str = "https://blynk.cloud"
    blynk_vpin_voltage: str = "V0"
    blynk_vpin_current: str = "V1"
    blynk_vpin_power: str = "V2"
    blynk_vpin_battery: str = "V3"
    ingest_url: str = "http://localhost:8000/ingest"
    poll_interval_seconds: int = 5

    gemini_api_key: str = ""

    # Seeds one admin account on first boot if the users table is empty.
    # Set to admin@example.com / admin for easy demo/grading access —
    # CHANGE THIS before any real public deployment.
    default_admin_email: str = "admin@example.com"
    default_admin_password: str = "admin"

    # Identifies which physical machine THIS bridge instance polls for.
    # Run one bridge deployment per machine, each with a different
    # BLYNK_AUTH_TOKEN and DEVICE_ID, all pointing at the same backend.
    device_id: str = "esp32-feeder-01"

    # --- Email verification (optional) ---
    # If email_verification_enabled is False (default), registration works
    # exactly as before — no email step. Turn this on only after you've
    # configured real SMTP credentials below and tested delivery yourself.
    email_verification_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Pellet Monitor"
    frontend_base_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
