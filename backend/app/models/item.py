from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base
from typing import TYPE_CHECKING
from app.models.category import Category

if TYPE_CHECKING:
    from app.models.requisition_item import RequisitionItem

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    desc_short = Column(String, nullable=True)
    unit = Column(String, nullable=False)
    manufacturer_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    catalogue_nr = Column(String)
    image_path = Column(String)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    desc_long = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    category = relationship("Category")
    manufacturer = relationship("Company", foreign_keys=[manufacturer_id])
    supplier = relationship("Company", foreign_keys=[supplier_id])
    requisition_items = relationship("RequisitionItem", back_populates="item", cascade="all, delete-orphan")

