from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class ReadingIn(BaseModel):
    voltage: Optional[float] = None
    current: Optional[float] = None
    power: Optional[float] = None
    battery_pct: Optional[float] = None
    custom_metrics: Optional[dict[str, float]] = None
    device_id: str = "esp32-feeder-01"


class ReadingOut(ReadingIn):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class ReadingUpdate(BaseModel):
    voltage: Optional[float] = None
    current: Optional[float] = None
    power: Optional[float] = None
    battery_pct: Optional[float] = None
    custom_metrics: Optional[dict[str, float]] = None


class ReadingTableRow(BaseModel):
    """One row of the admin CRUD table: reading + joined machine info."""
    id: int
    recorded_at: datetime
    voltage: Optional[float]
    current: Optional[float]
    power: Optional[float]
    battery_pct: Optional[float]
    device_id: str
    machine_name: Optional[str] = None
    machine_model: Optional[str] = None
    owner: Optional[str] = None


class StatsOut(BaseModel):
    parameter: str
    min: Optional[float]
    avg: Optional[float]
    max: Optional[float]


class StatusOut(BaseModel):
    device_id: str
    online: bool
    last_seen: Optional[datetime]


class MetricDefinitionIn(BaseModel):
    key: str = Field(..., description="Internal identifier, e.g. 'temperature'")
    label: str = Field(..., description="Shown in the UI, e.g. 'Temperature'")
    unit: str = ""
    vpin: str = Field(..., description="Blynk virtual pin, e.g. 'V4'")
    exclude_from_stats: bool = False


class MetricDefinitionOut(MetricDefinitionIn):
    id: Optional[int] = None
    is_core: bool = False

    class Config:
        from_attributes = True


class MachineIn(BaseModel):
    device_id: str
    machine_name: str
    machine_model: Optional[str] = None
    owner: Optional[str] = None


class MachineOut(MachineIn):
    created_at: datetime

    class Config:
        from_attributes = True


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


class UserOut(BaseModel):
    email: str
    role: str

    class Config:
        from_attributes = True


class ChangeCredentialsIn(BaseModel):
    current_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = Field(None, min_length=8, description="Leave blank to keep current password")
