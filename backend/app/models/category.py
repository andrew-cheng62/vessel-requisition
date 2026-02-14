# models/category.py
from app.db.base_class import Base
from sqlalchemy import Column, Integer, String, Boolean

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
