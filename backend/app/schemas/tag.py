from pydantic import BaseModel, field_validator
from typing import Optional
import re


class TagOut(BaseModel):
    id: int
    name: str
    slug: str
    color: str

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#6b7280"

    @field_validator("name")
    @classmethod
    def generate_slug(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tag name cannot be empty")
        return v.strip()


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
