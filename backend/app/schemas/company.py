from pydantic import BaseModel

class CompanyBase(BaseModel):
    name: str
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    is_manufacturer: bool = False
    is_supplier: bool = False
    comments: str | None = None
    logo_path: str | None = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: int

    class Config:
        from_attributes = True
