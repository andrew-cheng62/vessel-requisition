from pydantic import BaseModel
from typing import List

class CompanyBase(BaseModel):
    name: str
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    is_manufacturer: bool = False
    is_supplier: bool = False
    comments: str | None = None
    logo_path: str | None = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: int

    class Config:
        from_attributes = True

class PaginatedCompany(BaseModel):
    items: List[CompanyOut]
    total: int
    page: int
    page_size: int
    pages: int