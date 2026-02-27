from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.company import CompanyOut
from app.schemas.category import CategoryOut
from app.schemas.tag import TagOut


class ItemOut(BaseModel):
    id: int
    name: str
    desc_short: Optional[str] = None
    catalogue_nr: Optional[str] = None
    unit: str
    is_active: bool
    vessel_active: Optional[bool] = True
    image_path: Optional[str] = None
    manufacturer: Optional[CompanyOut] = None
    supplier: Optional[CompanyOut] = None
    category: CategoryOut
    desc_long: Optional[str] = None
    tags: List[TagOut] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, '_vessel_active'):
            instance.vessel_active = obj._vessel_active
        return instance


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
    tag_ids: Optional[List[int]] = None


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
    tag_ids: Optional[List[int]] = None


class ItemActiveUpdate(BaseModel):
    is_active: bool
