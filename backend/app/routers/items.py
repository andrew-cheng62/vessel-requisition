from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.auth import get_current_user
from app.models.item import Item
from app.models.user import User
from app.models.company import Company
from app.models.category import Category
from app.schemas.item import (ItemOut, ItemUpdate, ItemCreate, PaginatedItems, ItemActiveUpdate)
from uuid import uuid4
from typing import Optional
from pathlib import Path
from math import ceil
import os
from sqlalchemy import exists
from app.models import RequisitionItem, Requisition

ACTIVE_STATUSES = [
    "draft",
    "rfq_sent",
    "ordered",
    "partially_received",
]

router = APIRouter(prefix="/items", tags=["Items"])

UPLOAD_DIR = Path("media/items")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_category(db: Session, category_id: int | None):
    if category_id is None:
        return
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category_id")

def require_captain(current_user: User = Depends(get_current_user)):
    if current_user.role != "captain":
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user

@router.post("/", response_model=ItemOut)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    validate_category(db, item.category_id)

    db_item = Item(
           **item.model_dump(),
           created_by = current_user.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=PaginatedItems)
def get_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    manufacturer_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    is_active: Optional[str] = None
):
    q = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
        )
    )

    if is_active == "true":
        q = q.filter(Item.is_active == True)
    elif is_active == "false":
        q = q.filter(Item.is_active == False)

    if search:
        q = q.filter(Item.name.ilike(f"%{search}%"))

    if category_id:
        q = q.filter(Item.category_id == category_id)

    if manufacturer_id:
        q = q.filter(Item.manufacturer_id == manufacturer_id)

    if supplier_id:
        q = q.filter(Item.supplier_id == supplier_id)

    total = q.count()

    items = (
        q
        .order_by(Item.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": ceil(total / page_size)
    }

@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(Item)
        .options(
          joinedload(Item.manufacturer),
          joinedload(Item.supplier),
          joinedload(Item.category)
         )
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item

@router.post("/{item_id}/image")
def upload_item_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
        
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return {"error": "Item not found"}

    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    relative_path = f"{UPLOAD_DIR}/{filename}"
    absolute_path = os.path.abspath(relative_path)

    with open(absolute_path, "wb") as buffer:
        buffer.write(file.file.read())

    # SAVE RELATIVE PATH TO DB
    item.image_path = relative_path
    db.commit()
    db.refresh(item)

    return {
        "image_path": relative_path
    }


@router.delete("/{item_id}/image")
def delete_item_image(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item or not item.image_path:
        raise HTTPException(status_code=404, detail="Image not found")

    if os.path.exists(item.image_path):
        os.remove(item.image_path)

    item.image_path = None
    db.commit()

    return {"status": "deleted"}

@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
):
    db_item = db.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.category_id is not None:
        validate_category(db, item.category_id)

    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item

@router.patch("/{item_id}/active")
def set_item_active(
    item_id: int,
    payload: ItemActiveUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_captain)
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_active = payload.is_active
    db.commit()
    db.refresh(item)

    return item