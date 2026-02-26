from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    vessel_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Used by captain to invite/create a crew member within their vessel
class CrewCreate(BaseModel):
    username: str
    full_name: Optional[str] = None
    password: str
    role: str = "crew"   # captain can create crew or another captain

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        if v not in ("crew", "captain"):
            raise ValueError("Role must be 'crew' or 'captain'")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("crew", "captain"):
            raise ValueError("Role must be 'crew' or 'captain'")
        return v
