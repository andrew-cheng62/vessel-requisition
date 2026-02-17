from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.auth import get_current_user
from app.models.item import Item
from app.models.user import User
from app.models.company import Company
from app.models.category import Category
from app.schemas.item import ItemOut, ItemUpdate, ItemCreate
from uuid import uuid4
from typing import Optional
from pathlib import Path
import os

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

@router.get("/", response_model=list[ItemOut])
def get_items(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    manufacturer_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
        )
    )

    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))

    if category_id:
        query = query.filter(Item.category_id == category_id)

    if manufacturer_id:
        query = query.filter(Item.manufacturer_id == manufacturer_id)

    if supplier_id:
        query = query.filter(Item.supplier_id == supplier_id)

    return query.order_by(Item.name).all()

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

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.image_path and os.path.exists(item.image_path):
        os.remove(item.image_path)

    try:
        db.delete(item)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Item cannot be deleted because it is used in requisitions"
        )

    return {"status": "deleted"}

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
