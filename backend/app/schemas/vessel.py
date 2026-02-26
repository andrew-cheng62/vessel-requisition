from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class VesselCreate(BaseModel):
    name: str
    imo_number: Optional[str] = None
    flag: Optional[str] = None
    vessel_type: Optional[str] = None

    # Captain account to create alongside the vessel
    captain_username: str
    captain_full_name: str
    captain_password: str

    @field_validator("captain_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class VesselUpdate(BaseModel):
    name: Optional[str] = None
    imo_number: Optional[str] = None
    flag: Optional[str] = None
    vessel_type: Optional[str] = None
    is_active: Optional[bool] = None


class VesselOut(BaseModel):
    id: int
    name: str
    imo_number: Optional[str] = None
    flag: Optional[str] = None
    vessel_type: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VesselOutWithStats(VesselOut):
    user_count: int = 0
    item_count: int = 0
    requisition_count: int = 0
