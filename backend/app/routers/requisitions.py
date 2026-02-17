from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.database import SessionLocal
from app.models.requisition import Requisition
from app.models.requisition_item import RequisitionItem
from app.models.item import Item
from app.models.company import Company
from app.models.user import User
from app.auth import get_current_user
from app.schemas.requisition import ( RequisitionCreate, RequisitionUpdate, RequisitionOut)

# Helpers
ALLOWED_STATUS_TRANSITIONS = {
    "draft": {"rfq_sent", "cancelled"},
    "rfq_sent": {"ordered", "cancelled"},
    "ordered": {"partially_received", "received", "cancelled"},
    "partially_received": {"received"},
    "received": set(),
    "cancelled": set(),
}

def is_closed(status: str) -> bool:
    return status in ["received", "cancelled"]

def can_edit(req, user):
    if is_closed(req.status):
        return False
    if req.status == "draft":
        return True
    return user.role == "captain"

def can_change_status(req, user, new_status: str) -> bool:
    if user.role != "captain":
        return False

    allowed = ALLOWED_STATUS_TRANSITIONS.get(req.status, set())
    return new_status in allowed

def can_receive(req, user):
    return (
        user.role in {"captain", "crew"}
        and req.status in {"ordered", "partially_received"}
    )

def can_delete(req, user):
    # Only captain can delete
    if user.role != "captain":
        return False

    # Allow delete only if draft or cancelled
    return req.status in {"draft", "cancelled"}


router = APIRouter(prefix="/requisitions", tags=["Requisitions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RequisitionOut)
def create_requisition(
    data: RequisitionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # validate item
    if not data.items:
        raise HTTPException(status_code=400, detail="Requisition must contain at least one item")

    try:
        # Create requisition (header)
        requisition = Requisition(
            supplier_id=data.supplier_id,
            status="draft",
            created_by=user.id,
            created_at=datetime.utcnow(),
            notes=data.notes
        )

        db.add(requisition)
        db.flush()  # IMPORTANT: get requisition.id without commit

        # Create requisition items (rows)
        for row in data.items:
          ri = RequisitionItem(
            requisition_id=requisition.id,
            item_id=row.item_id,
            quantity=row.quantity,
            received_qty=0,
          )
          db.add(ri)

        db.commit()
        db.refresh(requisition)
        return requisition
    except Exception as e:
        db.rollback()
        print("❌ CREATE REQUISITION ERROR:", e)
        raise


@router.get("/", response_model=list[RequisitionOut])
def list_requisitions(
    status: str | None = None,
    supplier_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Requisition)
        .options(
            joinedload(Requisition.supplier),
            joinedload(Requisition.items),
        )
    )

    if status:
        q = q.filter(Requisition.status == status)

    if supplier_id:
        q = q.filter(Requisition.supplier_id == supplier_id)

    return q.order_by(Requisition.created_at.desc()).all()


@router.post("/{req_id}/status", response_model=RequisitionOut) # only Captain can change status, crew can only receive
def change_status(
    req_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(404, "Requisition not found")

    new_status = data.get("status")
    if not new_status:
        raise HTTPException(400, "Status required")

    if not can_change_status(req, current_user, new_status):
        raise HTTPException(403, "Invalid status transition")

    if new_status == "ordered":
        req.ordered_at = datetime.utcnow()

    req.status = new_status
    db.commit()
    req = (
        db.query(Requisition)
        .options(
            joinedload(Requisition.supplier),
            joinedload(Requisition.items).joinedload(RequisitionItem.item),
        )
        .filter(Requisition.id == req_id)
        .first()
    )
    return req

@router.post("/{req_id}/items/{req_item_id}/receive")
def receive_item(
    req_id: int,
    req_item_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = (
        db.query(Requisition)
        .options(joinedload(Requisition.items))
        .filter(Requisition.id == req_id)
        .first()
    )

    if not req:
        raise HTTPException(404, "Requisition not found")

    if not can_receive(req, current_user):
        raise HTTPException(403, "Receiving not allowed")

    item = next((i for i in req.items if i.id == req_item_id), None)
    if not item:
        raise HTTPException(404, "Requisition item not found")

    qty = data.get("quantity")
    if qty is None or qty <= 0:
        raise HTTPException(400, "Invalid quantity")

    remaining = item.quantity - item.received_qty
    if qty > remaining:
        raise HTTPException(400, f"Remaining quantity: {remaining}")

    item.received_qty += qty

    total = sum(i.quantity for i in req.items)
    received = sum(i.received_qty for i in req.items)

    if received < total:
        req.status = "partially_received"
    else:
        req.status = "received"

    db.commit()
    db.refresh(req)
    return req


@router.get("/{req_id}", response_model=RequisitionOut)
def get_requisition(req_id: int, db: Session = Depends(get_db)):
    req = (
        db.query(Requisition)
        .options(
            joinedload(Requisition.supplier),
            joinedload(Requisition.items).joinedload(RequisitionItem.item),
        )
        .filter(Requisition.id == req_id)
        .first()
    )

    if not req:
        raise HTTPException(404, "Requisition not found")

    return req

@router.put("/{req_id}", response_model=RequisitionOut)
def edit_requisition(
    req_id: int,
    data: RequisitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = (
        db.query(Requisition)
        .options(joinedload(Requisition.items))
        .filter(Requisition.id == req_id)
        .first()
    )

    if not req:
        raise HTTPException(404, "Requisition not found")

    if not can_edit(req, current_user):
        raise HTTPException(403, "Editing not allowed")

    if data.supplier_id is not None:
        req.supplier_id = data.supplier_id

    if data.notes is not None:
        req.notes = data.notes

    if data.items is not None:
        # remove old items
        req.items.clear()
        db.flush()

        # add new items
        for row in data.items:
            req.items.append(
                RequisitionItem(
                    item_id=row.item_id,
                    quantity=row.quantity,
                    received_qty=0
                )
            )

    db.commit()
    db.refresh(req)

    req = (
        db.query(Requisition)
        .options(
            joinedload(Requisition.supplier),
            joinedload(Requisition.items).joinedload(RequisitionItem.item),
        )
        .filter(Requisition.id == req_id)
        .first()
    )

    return req

@router.post("/{req_id}/items", response_model=RequisitionOut)
def add_item_to_requisition(
    req_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = (
        db.query(Requisition)
        .options(joinedload(Requisition.items))
        .filter(Requisition.id == req_id)
        .first()
    )

    if not req:
        raise HTTPException(404)

    if req.status != "draft":
        raise HTTPException(403, "Can only add items in draft")

    item_id = data.get("item_id")
    qty = data.get("quantity", 1)

    if not item_id:
        raise HTTPException(400, "item_id required")

    existing = next((i for i in req.items if i.item_id == item_id), None)
    if existing:
        existing.quantity += qty
    else:
        req.items.append(
            RequisitionItem(
                item_id=item_id,
                quantity=qty,
                received_qty=0,
            )
        )

    db.commit()
    db.refresh(req)
    return req

@router.delete("/{req_id}")
def delete_requisition(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = (
        db.query(Requisition)
        .options(joinedload(Requisition.items))
        .filter(Requisition.id == req_id)
        .first()
    )

    if not req:
        raise HTTPException(404, "Requisition not found")

    if not can_delete(req, current_user):
        raise HTTPException(403, "Deletion not allowed for this status")

    # Delete child items first (optional if cascade is configured)
    for item in req.items:
        db.delete(item)

    db.delete(req)
    db.commit()

    return {"message": "Requisition deleted"}

