from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — one level up from this file (backend/app/config.py)
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

if not ENV_PATH.exists():
    raise FileNotFoundError(
        f"Could not find .env at: {ENV_PATH}\n"
        "Make sure a file literally named '.env' (not '.env.txt') exists in the backend/ folder."
    )

# Explicitly load it into the process environment BEFORE Settings() reads anything.
# This sidesteps encoding/path quirks in pydantic-settings' own env_file loader.
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
    # LOG IN AND CHANGE THIS PASSWORD before showing this to anyone.
    default_admin_email: str = "admin@example.com"
    default_admin_password: str = "changeme123"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
