from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base_class import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.requisition_item import RequisitionItem

class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(Integer, primary_key=True)
    supplier_id = Column(ForeignKey("companies.id"), nullable=True)
    status = Column(String, default="draft")
    ordered_at = Column(DateTime)
    created_by = Column(UUID, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    items = relationship(
        "RequisitionItem",
        back_populates="requisition",
        cascade="all, delete-orphan"
    )
    supplier = relationship("Company", foreign_keys=[supplier_id])
