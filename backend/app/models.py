from sqlalchemy import Column, Integer, BigInteger, String, Float, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class Reading(Base):
    __tablename__ = "readings"

    id = Column(BigInteger, primary_key=True, index=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    power = Column(Float, nullable=True)
    battery_pct = Column(Float, nullable=True)
    custom_metrics = Column(JSONB, nullable=True)
    device_id = Column(String, default="esp32-feeder-01", index=True)


class MetricDefinition(Base):
    """Every parameter the dashboard knows about. Core 4 seeded on boot;
    admins can add more (temperature, hopper level, etc.) via the UI."""
    __tablename__ = "metric_definitions"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    label = Column(String, nullable=False)
    unit = Column(String, default="")
    vpin = Column(String, nullable=False)
    is_core = Column(Boolean, default=False)
    exclude_from_stats = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Machine(Base):
    """Identity info for a physical feeder unit — separate from the
    time-series readings table since this doesn't change every few seconds."""
    __tablename__ = "machines"

    device_id = Column(String, primary_key=True)   # matches Reading.device_id
    machine_name = Column(String, nullable=False)
    machine_model = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer")  # admin | viewer


class DeviceStatus(Base):
    __tablename__ = "device_status"

    device_id = Column(String, primary_key=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
