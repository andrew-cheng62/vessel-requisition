from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
from app.auth import get_current_user
from app.database import SessionLocal
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut, PaginatedCompany
from uuid import uuid4
from math import ceil
import os

router = APIRouter(prefix="/companies", tags=["Companies"])

UPLOAD_DIR = Path("media/companies")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/all", response_model=list[CompanyOut])
def list_all_companies(
    role: Optional[str] = Query(None, description="supplier | manufacturer"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Flat unpaginated list — for populating dropdowns only."""
    q = db.query(Company).filter(Company.is_active == True)
    if role == "supplier":
        q = q.filter(Company.is_supplier == True)
    elif role == "manufacturer":
        q = q.filter(Company.is_manufacturer == True)
    return q.order_by(Company.name).all()


@router.get("/", response_model=PaginatedCompany)
def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None, description="supplier | manufacturer"),
    db: Session = Depends(get_db),
):
    q = db.query(Company)

    if search:
        q = q.filter(Company.name.ilike(f"%{search}%"))
    if role == "supplier":
        q = q.filter(Company.is_supplier == True)
    if role == "manufacturer":
        q = q.filter(Company.is_manufacturer == True)

    total = q.count()
    items = q.order_by(Company.name).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": ceil(total / page_size) if total else 1,
    }


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    return company


@router.post("/", response_model=CompanyOut)
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.put("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return company


@router.post("/{company_id}/logo")
def upload_company_logo(
    company_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    relative_path = f"{UPLOAD_DIR}/{filename}"

    with open(os.path.abspath(relative_path), "wb") as buf:
        buf.write(file.file.read())

    if company.logo_path and os.path.exists(company.logo_path):
        os.remove(company.logo_path)

    company.logo_path = relative_path
    db.commit()
    db.refresh(company)
    return {"logo_path": relative_path}


@router.delete("/{company_id}/logo")
def delete_company_logo(
    company_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    company = db.get(Company, company_id)
    if not company or not company.logo_path:
        raise HTTPException(404, "Logo not found")
    if os.path.exists(company.logo_path):
        os.remove(company.logo_path)
    company.logo_path = None
    db.commit()
    return {"status": "deleted"}
