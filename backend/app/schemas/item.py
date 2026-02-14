from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from app.schemas.company import CompanyOut
from app.schemas.category import CategoryOut

class ItemBase(BaseModel):
    name: str
    unit: str
    description: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None

class ItemOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    catalogue_nr: Optional[str] = None
    unit: str
    image_path: Optional[str] = None

    manufacturer: Optional[CompanyOut] = None
    supplier: Optional[CompanyOut] = None
    category: Optional[CategoryOut] = None

    model_config = {
        "from_attributes": True
    }

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None

class ItemCreate(BaseModel):
    name: str
    unit: str
    description: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
