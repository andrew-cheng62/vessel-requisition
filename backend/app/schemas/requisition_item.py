from pydantic import BaseModel
from typing import Optional
from app.schemas.item import ItemOut


class RequisitionItemBase(BaseModel):
    item_id: int
    quantity: int
    unit: Optional[str] = None


class RequisitionItemCreate(BaseModel):
    item_id: int
    quantity: int
    supplier_id: Optional[int] = None


class RequisitionItemUpdate(BaseModel):
    quantity: Optional[int] = None
    received_qty: Optional[int] = None


class RequisitionItemOut(BaseModel):
    id: int
    quantity: int
    received_qty: int
    item: ItemOut

    model_config = {"from_attributes": True}