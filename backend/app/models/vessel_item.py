from sqlalchemy import Column, Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class VesselItem(Base):
    """
    Per-vessel override for items.
    If no row exists for a (vessel_id, item_id) pair, the item is considered
    active for that vessel (opt-out model — all items visible by default).
    A row is created when a vessel explicitly deactivates an item.
    """
    __tablename__ = "vessel_items"

    id = Column(Integer, primary_key=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("vessel_id", "item_id", name="uq_vessel_item"),
    )

    vessel = relationship("Vessel")
    item = relationship("Item", back_populates="vessel_overrides")
