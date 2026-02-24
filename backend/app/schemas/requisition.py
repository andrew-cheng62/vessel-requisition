from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.schemas.requisition_item import RequisitionItemCreate, RequisitionItemOut
from app.schemas.company import CompanyOut


class RequisitionBase(BaseModel):
    supplier_id: Optional[int] = None
    notes: Optional[str] = None

class RequisitionCreate(RequisitionBase):
    items: List[RequisitionItemCreate]

class RequisitionUpdate(BaseModel):
    supplier_id: Optional[int] = None
    status: Optional[list[RequisitionItemCreate]] = None
    notes: Optional[str] = None
    items: List[RequisitionItemCreate]
    is_active: bool

class RequisitionOut(BaseModel):
    id: int
    status: str
    created_at: datetime
    supplier: Optional[CompanyOut] = None
    notes: Optional[str] = None
    items: List[RequisitionItemOut]
    is_active: bool

    model_config = {
        "from_attributes": True
    }

class PaginatedRequisitions(BaseModel):
    items: List[RequisitionOut]
    total: int
    page: int
    page_size: int
    pages: int