# from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.company import CompanyOut
from app.schemas.category import CategoryOut

class ItemBase(BaseModel):
    name: str
    unit: str
    desc_short: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: int
    desc_long: Optional[str] = None
    is_active: bool

class ItemOut(BaseModel):
    id: int
    name: str
    desc_short: Optional[str] = None
    catalogue_nr: Optional[str] = None
    unit: str
    is_active: bool

    image_path: Optional[str] = None

    manufacturer: Optional[CompanyOut] = None
    supplier: Optional[CompanyOut] = None
    category: CategoryOut
    desc_long: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedItems(BaseModel):
    items: List[ItemOut]
    total: int
    page: int
    page_size: int
    pages: int

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    desc_short: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    desc_long: Optional[str] = None

class ItemCreate(BaseModel):
    name: str
    unit: str
    desc_short: Optional[str] = None
    catalogue_nr: Optional[str] = None
    manufacturer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    category_id: int
    desc_long: Optional[str] = None
    is_active: bool = True

class ItemActiveUpdate(BaseModel):
    is_active: bool