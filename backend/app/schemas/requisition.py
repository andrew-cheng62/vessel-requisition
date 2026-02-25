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

# FIX: status was typed as Optional[list[RequisitionItemCreate]] — nonsensical.
# Removed it from update schema (status is changed via the dedicated /status endpoint).
# items and is_active made Optional so partial updates work correctly.
class RequisitionUpdate(BaseModel):
    supplier_id: Optional[int] = None
    notes: Optional[str] = None
    items: Optional[List[RequisitionItemCreate]] = None
    is_active: Optional[bool] = None

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
