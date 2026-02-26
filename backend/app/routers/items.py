from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.auth import get_current_user, require_captain, require_super_admin
from app.models.item import Item
from app.models.vessel_item import VesselItem
from app.models.user import User
from app.models.category import Category
from app.schemas.item import ItemOut, ItemUpdate, ItemCreate, PaginatedItems, ItemActiveUpdate
from uuid import uuid4
from typing import Optional
from pathlib import Path
from math import ceil
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
    if not db.get(Category, category_id):
        raise HTTPException(status_code=400, detail="Invalid category_id")


def get_vessel_item_status(db: Session, item_id: int, vessel_id: int) -> bool:
    """
    Returns the effective is_active for an item from a vessel's perspective.
    If no override row exists, the item is considered active (opt-out model).
    """
    override = db.query(VesselItem).filter(
        VesselItem.vessel_id == vessel_id,
        VesselItem.item_id == item_id,
    ).first()
    return override.is_active if override else True


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ItemOut)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_category(db, item.category_id)
    db_item = Item(**item.model_dump(), created_by=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Attach vessel_active for the response
    db_item._vessel_active = get_vessel_item_status(db, db_item.id, current_user.vessel_id) if current_user.vessel_id else True
    return db_item


@router.get("/", response_model=PaginatedItems)
def get_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    manufacturer_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    show_inactive: Optional[str] = Query(None),   # "true" = show globally inactive (super_admin)
    show_vessel_inactive: Optional[str] = Query(None),  # "true" = show vessel-deactivated items
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
        )
    )

    # Global active filter — super_admin can see all
    if current_user.role != "super_admin":
        q = q.filter(Item.is_active == True)
    elif show_inactive != "true":
        q = q.filter(Item.is_active == True)

    if search:
        q = q.filter(Item.name.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(Item.category_id == category_id)
    if manufacturer_id:
        q = q.filter(Item.manufacturer_id == manufacturer_id)
    if supplier_id:
        q = q.filter(Item.supplier_id == supplier_id)

    total = q.count()
    items = q.order_by(Item.name).offset((page - 1) * page_size).limit(page_size).all()

    # Attach vessel-level active status to each item
    vessel_id = current_user.vessel_id
    if vessel_id:
        # Load all overrides for this vessel in one query
        item_ids = [i.id for i in items]
        overrides = {
            vi.item_id: vi.is_active
            for vi in db.query(VesselItem).filter(
                VesselItem.vessel_id == vessel_id,
                VesselItem.item_id.in_(item_ids),
            ).all()
        }
        for item in items:
            item._vessel_active = overrides.get(item.id, True)  # default True = visible

        # Filter out vessel-deactivated items unless captain asked to see them
        if show_vessel_inactive != "true":
            items = [i for i in items if i._vessel_active]
            total = len(items)  # approximate — good enough for UX
    else:
        for item in items:
            item._vessel_active = True

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": ceil(total / page_size) if total > 0 else 1,
    }


@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
        )
        .filter(Item.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if current_user.vessel_id:
        item._vessel_active = get_vessel_item_status(db, item.id, current_user.vessel_id)
    else:
        item._vessel_active = True
    return item


@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    if current_user.vessel_id:
        db_item._vessel_active = get_vessel_item_status(db, db_item.id, current_user.vessel_id)
    else:
        db_item._vessel_active = True
    return db_item


# ── Active toggles ────────────────────────────────────────────────────────────

@router.patch("/{item_id}/active")
def set_item_active_global(
    item_id: int,
    payload: ItemActiveUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),   # ONLY super_admin
):
    """Toggle global is_active. Only super_admin."""
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_active = payload.is_active
    db.commit()
    return {"id": item_id, "is_active": item.is_active}


@router.patch("/{item_id}/vessel-active")
def set_item_active_vessel(
    item_id: int,
    payload: ItemActiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    """
    Toggle vessel-level visibility. Captain only.
    Creates or updates the VesselItem override row.
    """
    item = db.get(Item, item_id)
    if not item or not item.is_active:
        raise HTTPException(status_code=404, detail="Item not found")

    override = db.query(VesselItem).filter(
        VesselItem.vessel_id == current_user.vessel_id,
        VesselItem.item_id == item_id,
    ).first()

    if override:
        override.is_active = payload.is_active
    else:
        override = VesselItem(
            vessel_id=current_user.vessel_id,
            item_id=item_id,
            is_active=payload.is_active,
        )
        db.add(override)

    db.commit()
    return {"id": item_id, "vessel_active": override.is_active}


# ── Images ────────────────────────────────────────────────────────────────────

@router.post("/{item_id}/image")
def upload_item_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    relative_path = f"{UPLOAD_DIR}/{filename}"

    with open(os.path.abspath(relative_path), "wb") as buf:
        buf.write(file.file.read())

    item.image_path = relative_path
    db.commit()
    return {"image_path": relative_path}


@router.delete("/{item_id}/image")
def delete_item_image(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if not item or not item.image_path:
        raise HTTPException(status_code=404, detail="Image not found")
    if os.path.exists(item.image_path):
        os.remove(item.image_path)
    item.image_path = None
    db.commit()
    return {"status": "deleted"}
