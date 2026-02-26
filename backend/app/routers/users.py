from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.auth import get_current_user, require_captain, hash_password
from app.models.user import User
from app.schemas.user import UserOut, CrewCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserOut])
def list_crew(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    """List all users in the current user's vessel."""
    return (
        db.query(User)
        .filter(User.vessel_id == current_user.vessel_id)
        .order_by(User.full_name)
        .all()
    )


@router.post("/", response_model=UserOut, status_code=201)
def create_crew(
    data: CrewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    """Captain creates a new crew member (or co-captain) in their vessel."""
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(400, "Username already taken")

    user = User(
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        password_hash=hash_password(data.password),
        vessel_id=current_user.vessel_id,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Could not create user")

    return user


@router.put("/{user_id}", response_model=UserOut)
def update_crew(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    from uuid import UUID
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Captain can only edit users in their own vessel
    if current_user.role != "super_admin" and user.vessel_id != current_user.vessel_id:
        raise HTTPException(403, "Forbidden")

    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def deactivate_crew(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    from uuid import UUID
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(404, "User not found")

    if current_user.role != "super_admin" and user.vessel_id != current_user.vessel_id:
        raise HTTPException(403, "Forbidden")

    if str(user.id) == str(current_user.id):
        raise HTTPException(400, "Cannot deactivate yourself")

    user.is_active = False
    db.commit()
    return {"status": "deactivated"}
