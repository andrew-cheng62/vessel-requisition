from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from app.database import SessionLocal
from app.auth import get_current_user, require_captain, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserOut, CrewCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/change-password")
def change_own_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any user can change their own password — must provide old password."""
    if len(data.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    # Re-fetch user in this session so the update is tracked and committed correctly
    user = db.get(User, current_user.id)
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")

    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"status": "password changed"}


@router.get("/", response_model=list[UserOut])
def list_crew(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
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
    existing = db.query(User).filter(
        User.username == data.username,
        User.vessel_id == current_user.vessel_id,
    ).first()
    if existing:
        raise HTTPException(400, "Username already taken on this vessel")

    user = User(
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        password_hash=hash_password(data.password),
        vessel_id=current_user.vessel_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
def reset_crew_password(
    user_id: str,
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    """Captain resets a crew member's password — no old password needed."""
    if len(data.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.vessel_id != current_user.vessel_id:
        raise HTTPException(403, "Forbidden")

    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"status": "password reset"}


@router.put("/{user_id}", response_model=UserOut)
def update_crew(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_captain),
):
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(404, "User not found")
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
