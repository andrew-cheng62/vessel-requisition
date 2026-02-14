from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    website = Column(String)
    email = Column(String)
    phone = Column(String)
    comments = Column(String)
    logo_path = Column(String)

    is_manufacturer = Column(Boolean, default=False)
    is_supplier = Column(Boolean, default=False)

    manufactured_items = relationship(
        "Item",
        foreign_keys="Item.manufacturer_id",
        back_populates="manufacturer",
    )

#    supplied_items = relationship(
#        "Item",
#        foreign_keys="Item.supplier_id",
#        back_populates="supplier",
#    )
