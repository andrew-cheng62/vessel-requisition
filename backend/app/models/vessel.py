from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    imo_number = Column(String(20), unique=True, nullable=True)
    flag = Column(String(50), nullable=True)
    vessel_type = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Users still belong to a vessel
    users = relationship("User", back_populates="vessel")

    # Requisitions still belong to a vessel
    requisitions = relationship("Requisition", back_populates="vessel")

    # NOTE: No items relationship — items are now global (no vessel_id on Item)
    # Per-vessel visibility is handled via the VesselItem override table