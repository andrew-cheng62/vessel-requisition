from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database import SessionLocal
from app.auth import get_current_user, require_captain, require_super_admin
from app.models.item import Item
from app.models.tag import Tag
from app.models.vessel_item import VesselItem
from app.models.user import User
from app.models.category import Category
from app.models.requisition import Requisition
from app.models.requisition_item import RequisitionItem
from app.schemas.item import ItemOut, ItemUpdate, ItemCreate, PaginatedItems, ItemActiveUpdate
from uuid import uuid4
from typing import Optional, List
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
        raise HTTPException(400, "Invalid category_id")


def get_vessel_item_status(db: Session, item_id: int, vessel_id: int) -> bool:
    override = db.query(VesselItem).filter(
        VesselItem.vessel_id == vessel_id,
        VesselItem.item_id == item_id,
    ).first()
    return override.is_active if override else True


def attach_tags(db: Session, item: Item, tag_ids: List[int] | None):
    if tag_ids is None:
        return
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
    item.tags = tags


# ── Recently Ordered ──────────────────────────────────────────────────────────

@router.get("/recently-ordered", response_model=list[ItemOut])
def recently_ordered(
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns recently ordered items for the current vessel, distinct, most recent first."""
    if not current_user.vessel_id:
        return []

    # Subquery: latest requisition date per item for this vessel
    subq = (
        db.query(
            RequisitionItem.item_id,
            func.max(Requisition.created_at).label("last_ordered"),
        )
        .join(Requisition, RequisitionItem.requisition_id == Requisition.id)
        .filter(Requisition.vessel_id == current_user.vessel_id)
        .group_by(RequisitionItem.item_id)
        .order_by(func.max(Requisition.created_at).desc())
        .limit(limit)
        .subquery()
    )

    items = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
            joinedload(Item.tags),
        )
        .join(subq, Item.id == subq.c.item_id)
        .filter(Item.is_active == True)
        .order_by(subq.c.last_ordered.desc())
        .all()
    )

    for item in items:
        item._vessel_active = get_vessel_item_status(db, item.id, current_user.vessel_id)

    return items


# ── List / Search ─────────────────────────────────────────────────────────────

@router.get("/", response_model=PaginatedItems)
def get_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    manufacturer_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    tag_ids: Optional[str] = Query(None),  # comma-separated: "1,2,3"
    show_inactive: Optional[str] = Query(None),
    show_vessel_inactive: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(Item)
        .options(
            joinedload(Item.manufacturer),
            joinedload(Item.supplier),
            joinedload(Item.category),
            joinedload(Item.tags),
        )
    )

    # Global active filter
    if current_user.role != "super_admin" or show_inactive != "true":
        q = q.filter(Item.is_active == True)

    # Search — name, catalogue_nr, desc_short
    if search:
        term = f"%{search}%"
        q = q.filter(
            Item.name.ilike(term) |
            Item.catalogue_nr.ilike(term) |
            Item.desc_short.ilike(term)
        )

    if category_id:
        q = q.filter(Item.category_id == category_id)
    if manufacturer_id:
        q = q.filter(Item.manufacturer_id == manufacturer_id)
    if supplier_id:
        q = q.filter(Item.supplier_id == supplier_id)

    # Tag filter — item must have ALL specified tags
    if tag_ids:
        ids = [int(i) for i in tag_ids.split(",") if i.strip().isdigit()]
        for tid in ids:
            q = q.filter(Item.tags.any(Tag.id == tid))

    total = q.count()
    items = q.order_by(Item.name).offset((page - 1) * page_size).limit(page_size).all()

    # Attach vessel-level active status
    vessel_id = current_user.vessel_id
    if vessel_id:
        item_ids = [i.id for i in items]
        overrides = {
            vi.item_id: vi.is_active
            for vi in db.query(VesselItem).filter(
                VesselItem.vessel_id == vessel_id,
                VesselItem.item_id.in_(item_ids),
            ).all()
        }
        for item in items:
            item._vessel_active = overrides.get(item.id, True)
        if show_vessel_inactive != "true":
            items = [i for i in items if i._vessel_active]
            total = len(items)
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


# ── Single item ───────────────────────────────────────────────────────────────

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
            joinedload(Item.tags),
        )
        .filter(Item.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item not found")
    item._vessel_active = get_vessel_item_status(db, item.id, current_user.vessel_id) if current_user.vessel_id else True
    return item


@router.post("/", response_model=ItemOut)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_category(db, item.category_id)
    data = item.model_dump(exclude={"tag_ids"})
    db_item = Item(**data, created_by=current_user.id)
    db.add(db_item)
    db.flush()
    attach_tags(db, db_item, item.tag_ids)
    db.commit()
    db.refresh(db_item)
    db_item._vessel_active = True
    return db_item


@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_item = db.get(Item, item_id)
    if not db_item:
        raise HTTPException(404, "Item not found")
    if item.category_id is not None:
        validate_category(db, item.category_id)

    data = item.model_dump(exclude_unset=True, exclude={"tag_ids"})
    for key, value in data.items():
        setattr(db_item, key, value)

    if item.tag_ids is not None:
        attach_tags(db, db_item, item.tag_ids)

    db.commit()
    db.refresh(db_item)
    db_item._vessel_active = get_vessel_item_status(db, db_item.id, current_user.vessel_id) if current_user.vessel_id else True
    return db_item


# ── Active toggles ────────────────────────────────────────────────────────────

@router.patch("/{item_id}/active")
def set_item_active_global(
    item_id: int,
    payload: ItemActiveUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
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
    item = db.get(Item, item_id)
    if not item or not item.is_active:
        raise HTTPException(404, "Item not found")

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
        raise HTTPException(404, "Item not found")
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
        raise HTTPException(404, "Image not found")
    if os.path.exists(item.image_path):
        os.remove(item.image_path)
    item.image_path = None
    db.commit()
    return {"status": "deleted"}
