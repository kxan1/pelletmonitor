from datetime import datetime, timedelta, timezone
from io import StringIO
import csv
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db, SessionLocal
from app import models, schemas
from app.config import settings
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chicken Feeder Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RANGE_TO_TIMEDELTA = {
    "live": timedelta(minutes=1),
    "3m": timedelta(minutes=3),
    "5m": timedelta(minutes=5),
    "1h": timedelta(hours=1),
    "3h": timedelta(hours=3),
    "1d": timedelta(days=1),
    "1wk": timedelta(weeks=1),
}

CORE_METRIC_SEEDS = [
    {"key": "voltage", "label": "Voltage", "unit": "V", "vpin": settings.blynk_vpin_voltage, "exclude_from_stats": False},
    {"key": "current", "label": "Current", "unit": "A", "vpin": settings.blynk_vpin_current, "exclude_from_stats": False},
    {"key": "power", "label": "Power", "unit": "W", "vpin": settings.blynk_vpin_power, "exclude_from_stats": False},
    {"key": "battery_pct", "label": "Battery", "unit": "%", "vpin": settings.blynk_vpin_battery, "exclude_from_stats": True},
]


def seed_core_metrics():
    db = SessionLocal()
    try:
        for seed in CORE_METRIC_SEEDS:
            existing = db.query(models.MetricDefinition).filter_by(key=seed["key"]).first()
            if not existing:
                db.add(models.MetricDefinition(**seed, is_core=True))
        db.commit()
    finally:
        db.close()


def seed_default_admin():
    """Creates a default admin login on first boot IF no users exist yet.
    Change this password immediately after your first login."""
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            db.add(models.User(
                email=settings.default_admin_email,
                hashed_password=hash_password(settings.default_admin_password),
                role="admin",
            ))
            db.commit()
    finally:
        db.close()


seed_core_metrics()
seed_default_admin()


def verify_ingest_key(x_ingest_key: str = Header(...)):
    if x_ingest_key != settings.ingest_api_key:
        raise HTTPException(status_code=401, detail="Invalid ingest key")


@app.get("/")
def root():
    return {"status": "ok", "service": "chicken-feeder-api"}


# ---------- AUTH ----------
@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return schemas.Token(access_token=token, role=user.role, email=user.email)


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.put("/auth/me", response_model=schemas.UserOut)
def change_credentials(
    payload: schemas.ChangeCredentialsIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if payload.new_email and payload.new_email != current_user.email:
        existing = db.query(models.User).filter_by(email=payload.new_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="That email is already in use")
        current_user.email = payload.new_email

    if payload.new_password:
        current_user.hashed_password = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


# ---------- METRIC DEFINITIONS ("keys") ----------
@app.get("/metrics", response_model=list[schemas.MetricDefinitionOut])
def get_metrics(db: Session = Depends(get_db)):
    return (
        db.query(models.MetricDefinition)
        .order_by(models.MetricDefinition.is_core.desc(), models.MetricDefinition.id)
        .all()
    )


@app.post("/metrics", response_model=schemas.MetricDefinitionOut, dependencies=[Depends(require_admin)])
def create_metric(metric: schemas.MetricDefinitionIn, db: Session = Depends(get_db)):
    key = metric.key.strip().lower().replace(" ", "_")
    if not key:
        raise HTTPException(status_code=400, detail="key cannot be empty")
    existing = db.query(models.MetricDefinition).filter_by(key=key).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"metric key '{key}' already exists")

    row = models.MetricDefinition(
        key=key, label=metric.label, unit=metric.unit, vpin=metric.vpin,
        exclude_from_stats=metric.exclude_from_stats, is_core=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/metrics/{key}", response_model=schemas.MetricDefinitionOut, dependencies=[Depends(require_admin)])
def update_metric(key: str, metric: schemas.MetricDefinitionIn, db: Session = Depends(get_db)):
    row = db.query(models.MetricDefinition).filter_by(key=key).first()
    if not row:
        raise HTTPException(status_code=404, detail="metric not found")
    row.vpin = metric.vpin
    row.unit = metric.unit
    row.exclude_from_stats = metric.exclude_from_stats
    if not row.is_core:
        row.label = metric.label
    db.commit()
    db.refresh(row)
    return row


@app.delete("/metrics/{key}", dependencies=[Depends(require_admin)])
def delete_metric(key: str, db: Session = Depends(get_db)):
    row = db.query(models.MetricDefinition).filter_by(key=key).first()
    if not row:
        raise HTTPException(status_code=404, detail="metric not found")
    if row.is_core:
        raise HTTPException(status_code=400, detail="cannot delete a core metric")
    db.delete(row)
    db.commit()
    return {"deleted": key}


# ---------- MACHINES (device identity: name, model, owner) ----------
@app.get("/machines", response_model=list[schemas.MachineOut])
def get_machines(db: Session = Depends(get_db)):
    return db.query(models.Machine).all()


@app.post("/machines", response_model=schemas.MachineOut, dependencies=[Depends(require_admin)])
def create_machine(machine: schemas.MachineIn, db: Session = Depends(get_db)):
    existing = db.query(models.Machine).filter_by(device_id=machine.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"device_id '{machine.device_id}' already registered")
    row = models.Machine(**machine.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/machines/{device_id}", response_model=schemas.MachineOut, dependencies=[Depends(require_admin)])
def update_machine(device_id: str, machine: schemas.MachineIn, db: Session = Depends(get_db)):
    row = db.query(models.Machine).filter_by(device_id=device_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="machine not found")
    row.machine_name = machine.machine_name
    row.machine_model = machine.machine_model
    row.owner = machine.owner
    db.commit()
    db.refresh(row)
    return row


@app.delete("/machines/{device_id}", dependencies=[Depends(require_admin)])
def delete_machine(device_id: str, db: Session = Depends(get_db)):
    row = db.query(models.Machine).filter_by(device_id=device_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="machine not found")
    db.delete(row)
    db.commit()
    return {"deleted": device_id}


# ---------- INGESTION (called only by blynk_bridge.py) ----------
@app.post("/ingest", response_model=schemas.ReadingOut, dependencies=[Depends(verify_ingest_key)])
def ingest_reading(reading: schemas.ReadingIn, db: Session = Depends(get_db)):
    db_reading = models.Reading(**reading.model_dump())
    db.add(db_reading)

    status_row = db.get(models.DeviceStatus, reading.device_id)
    if status_row:
        status_row.last_seen = datetime.now(timezone.utc)
    else:
        db.add(models.DeviceStatus(device_id=reading.device_id))

    # Auto-register the machine if it hasn't been added yet, so the CRUD/join
    # view always has a row to show (name/model/owner can be filled in later).
    machine = db.query(models.Machine).filter_by(device_id=reading.device_id).first()
    if not machine:
        db.add(models.Machine(device_id=reading.device_id, machine_name=reading.device_id))

    db.commit()
    db.refresh(db_reading)
    return db_reading


# ---------- READ: latest value ----------
@app.get("/readings/latest", response_model=Optional[schemas.ReadingOut])
def latest_reading(device_id: str = "esp32-feeder-01", db: Session = Depends(get_db)):
    row = (
        db.query(models.Reading)
        .filter(models.Reading.device_id == device_id)
        .order_by(models.Reading.recorded_at.desc())
        .first()
    )
    return row


# ---------- READ: time-ranged series ----------
@app.get("/readings", response_model=list[schemas.ReadingOut])
def get_readings(
    range: str = Query("1h"),
    device_id: str = "esp32-feeder-01",
    db: Session = Depends(get_db),
):
    if range not in RANGE_TO_TIMEDELTA:
        raise HTTPException(status_code=400, detail=f"range must be one of {list(RANGE_TO_TIMEDELTA)}")
    since = datetime.now(timezone.utc) - RANGE_TO_TIMEDELTA[range]
    rows = (
        db.query(models.Reading)
        .filter(models.Reading.device_id == device_id, models.Reading.recorded_at >= since)
        .order_by(models.Reading.recorded_at.asc())
        .all()
    )
    return rows


# ---------- READ: min/avg/max, core + custom keys ----------
CORE_KEYS = {"voltage", "current", "power", "battery_pct"}


@app.get("/readings/stats", response_model=list[schemas.StatsOut])
def get_stats(range: str = Query("1h"), device_id: str = "esp32-feeder-01", db: Session = Depends(get_db)):
    if range not in RANGE_TO_TIMEDELTA:
        raise HTTPException(status_code=400, detail=f"range must be one of {list(RANGE_TO_TIMEDELTA)}")
    since = datetime.now(timezone.utc) - RANGE_TO_TIMEDELTA[range]
    rows = (
        db.query(models.Reading)
        .filter(models.Reading.device_id == device_id, models.Reading.recorded_at >= since)
        .all()
    )
    metrics = db.query(models.MetricDefinition).filter_by(exclude_from_stats=False).all()

    results = []
    for m in metrics:
        if m.key in CORE_KEYS:
            values = [getattr(r, m.key) for r in rows if getattr(r, m.key) is not None]
        else:
            values = [r.custom_metrics[m.key] for r in rows if r.custom_metrics and m.key in r.custom_metrics]
        if values:
            results.append(schemas.StatsOut(parameter=m.key, min=min(values), avg=sum(values) / len(values), max=max(values)))
        else:
            results.append(schemas.StatsOut(parameter=m.key, min=None, avg=None, max=None))
    return results


# ---------- READ: online/offline ----------
@app.get("/status", response_model=schemas.StatusOut)
def get_status(device_id: str = "esp32-feeder-01", db: Session = Depends(get_db)):
    row = db.get(models.DeviceStatus, device_id)
    if not row:
        return schemas.StatusOut(device_id=device_id, online=False, last_seen=None)
    threshold = timedelta(seconds=settings.poll_interval_seconds * 3)
    online = (datetime.now(timezone.utc) - row.last_seen.replace(tzinfo=timezone.utc)) < threshold
    return schemas.StatusOut(device_id=device_id, online=online, last_seen=row.last_seen)


# ---------- CRUD on logged readings, joined with machine info (admin only) ----------
@app.get("/readings/table", response_model=list[schemas.ReadingTableRow], dependencies=[Depends(require_admin)])
def get_readings_table(
    device_id: str = "esp32-feeder-01",
    limit: int = Query(50, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Powers the admin CRUD screen: readings + machine_name/model/owner in one row."""
    machine = db.query(models.Machine).filter_by(device_id=device_id).first()
    rows = (
        db.query(models.Reading)
        .filter(models.Reading.device_id == device_id)
        .order_by(models.Reading.recorded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        schemas.ReadingTableRow(
            id=r.id,
            recorded_at=r.recorded_at,
            voltage=r.voltage,
            current=r.current,
            power=r.power,
            battery_pct=r.battery_pct,
            device_id=r.device_id,
            machine_name=machine.machine_name if machine else None,
            machine_model=machine.machine_model if machine else None,
            owner=machine.owner if machine else None,
        )
        for r in rows
    ]


@app.get("/readings/{reading_id}", response_model=schemas.ReadingOut, dependencies=[Depends(require_admin)])
def get_reading(reading_id: int, db: Session = Depends(get_db)):
    row = db.get(models.Reading, reading_id)
    if not row:
        raise HTTPException(status_code=404, detail="Reading not found")
    return row


@app.put("/readings/{reading_id}", response_model=schemas.ReadingOut, dependencies=[Depends(require_admin)])
def update_reading(reading_id: int, patch: schemas.ReadingUpdate, db: Session = Depends(get_db)):
    row = db.get(models.Reading, reading_id)
    if not row:
        raise HTTPException(status_code=404, detail="Reading not found")
    for field, value in patch.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


@app.delete("/readings/{reading_id}", dependencies=[Depends(require_admin)])
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    row = db.get(models.Reading, reading_id)
    if not row:
        raise HTTPException(status_code=404, detail="Reading not found")
    db.delete(row)
    db.commit()
    return {"deleted": reading_id}


# ---------- EXPORT: CSV, importable directly into OriginPro and Power BI ----------
@app.get("/export/csv")
def export_csv(range: str = Query("1h"), device_id: str = "esp32-feeder-01", db: Session = Depends(get_db)):
    if range not in RANGE_TO_TIMEDELTA:
        raise HTTPException(status_code=400, detail=f"range must be one of {list(RANGE_TO_TIMEDELTA)}")
    since = datetime.now(timezone.utc) - RANGE_TO_TIMEDELTA[range]
    rows = (
        db.query(models.Reading)
        .filter(models.Reading.device_id == device_id, models.Reading.recorded_at >= since)
        .order_by(models.Reading.recorded_at.asc())
        .all()
    )
    machine = db.query(models.Machine).filter_by(device_id=device_id).first()
    custom_keys = [m.key for m in db.query(models.MetricDefinition).filter_by(is_core=False).all()]

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "recorded_at", "voltage", "current", "power", "battery_pct", *custom_keys,
        "device_id", "machine_name", "machine_model", "owner",
    ])
    for r in rows:
        custom_values = [(r.custom_metrics or {}).get(k) for k in custom_keys]
        writer.writerow([
            r.recorded_at.isoformat(), r.voltage, r.current, r.power, r.battery_pct, *custom_values,
            r.device_id,
            machine.machine_name if machine else "",
            machine.machine_model if machine else "",
            machine.owner if machine else "",
        ])
    buffer.seek(0)

    filename = f"feeder_readings_{device_id}_{range}.csv"
    return StreamingResponse(
        buffer, media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
