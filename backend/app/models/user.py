from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), nullable=False)  # super_admin | captain | crew
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    # NULL for super_admin
    vessel_id = Column(Integer, ForeignKey("vessels.id", ondelete="CASCADE"), nullable=True)
    vessel = relationship("Vessel", back_populates="users")

    __table_args__ = (
        # Username only needs to be unique within a vessel
        # super_admin users have vessel_id=NULL so they don't conflict
        UniqueConstraint("username", "vessel_id", name="uq_username_per_vessel"),
    )
