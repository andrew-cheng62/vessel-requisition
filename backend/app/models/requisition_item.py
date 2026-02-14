from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.requisition import Requisition

class RequisitionItem(Base):
    __tablename__ = "requisition_items"

    id = Column(Integer, primary_key=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False)
    supplier_id = Column(ForeignKey("companies.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    received_qty = Column(Integer, default=0)

    item = relationship("Item")
    requisition = relationship("Requisition", back_populates="items")
    supplier = relationship("Company")