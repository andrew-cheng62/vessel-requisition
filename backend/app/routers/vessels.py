from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.auth import get_current_user, require_super_admin, hash_password
from app.models.vessel import Vessel
from app.models.user import User
from app.models.item import Item
from app.models.requisition import Requisition
from app.schemas.vessel import VesselCreate, VesselUpdate, VesselOut, VesselOutWithStats

router = APIRouter(prefix="/vessels", tags=["Vessels"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _with_stats(vessel: Vessel, db: Session) -> VesselOutWithStats:
    """Build VesselOutWithStats by querying counts directly — avoids broken relationships."""
    user_count = db.query(User).filter(User.vessel_id == vessel.id).count()
    requisition_count = db.query(Requisition).filter(Requisition.vessel_id == vessel.id).count()
    # Items are global — count all active items as a proxy for the catalog size
    item_count = db.query(Item).filter(Item.is_active == True).count()

    return VesselOutWithStats(
        id=vessel.id,
        name=vessel.name,
        imo_number=vessel.imo_number,
        flag=vessel.flag,
        vessel_type=vessel.vessel_type,
        is_active=vessel.is_active,
        created_at=vessel.created_at,
        user_count=user_count,
        item_count=item_count,
        requisition_count=requisition_count,
    )


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/public")
def list_vessels_public(db: Session = Depends(get_db)):
    """Public endpoint for the login page vessel dropdown."""
    vessels = (
        db.query(Vessel.id, Vessel.name)
        .filter(Vessel.is_active == True)
        .order_by(Vessel.name)
        .all()
    )
    return [{"id": v.id, "name": v.name} for v in vessels]


@router.post("/register", response_model=VesselOut, status_code=201)
def register_vessel(data: VesselCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.username == data.captain_username,
    ).first()
    # Can't check vessel uniqueness yet since vessel doesn't exist — just check IMO
    if data.imo_number:
        if db.query(Vessel).filter(Vessel.imo_number == data.imo_number).first():
            raise HTTPException(400, "A vessel with this IMO number already exists")

    try:
        vessel = Vessel(
            name=data.name,
            imo_number=data.imo_number or None,
            flag=data.flag,
            vessel_type=data.vessel_type,
        )
        db.add(vessel)
        db.flush()

        captain = User(
            username=data.captain_username,
            full_name=data.captain_full_name,
            role="captain",
            password_hash=hash_password(data.captain_password),
            vessel_id=vessel.id,
        )
        db.add(captain)
        db.commit()
        db.refresh(vessel)
        return vessel

    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Registration failed — username may already be taken on this vessel")


# ── Authenticated ─────────────────────────────────────────────────────────────

@router.get("/", response_model=list[VesselOutWithStats])
def list_vessels(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    vessels = db.query(Vessel).order_by(Vessel.name).all()
    return [_with_stats(v, db) for v in vessels]


@router.get("/{vessel_id}", response_model=VesselOutWithStats)
def get_vessel(
    vessel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "super_admin" and current_user.vessel_id != vessel_id:
        raise HTTPException(403, "Forbidden")
    vessel = db.get(Vessel, vessel_id)
    if not vessel:
        raise HTTPException(404, "Vessel not found")
    return _with_stats(vessel, db)


@router.put("/{vessel_id}", response_model=VesselOut)
def update_vessel(
    vessel_id: int,
    data: VesselUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("super_admin", "captain"):
        raise HTTPException(403, "Forbidden")
    if current_user.role == "captain" and current_user.vessel_id != vessel_id:
        raise HTTPException(403, "Forbidden")

    vessel = db.get(Vessel, vessel_id)
    if not vessel:
        raise HTTPException(404, "Vessel not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vessel, key, value)

    db.commit()
    db.refresh(vessel)
    return vessel


@router.delete("/{vessel_id}")
def deactivate_vessel(
    vessel_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    vessel = db.get(Vessel, vessel_id)
    if not vessel:
        raise HTTPException(404, "Vessel not found")
    vessel.is_active = False
    db.commit()
    return {"status": "deactivated"}