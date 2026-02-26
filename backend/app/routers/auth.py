from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.auth import authenticate_user, create_access_token, get_db
from app.models.vessel import Vessel

router = APIRouter(tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str
    vessel_id: Optional[int] = None   # None = super_admin login


@router.get("/vessels/public", tags=["Auth"])
def list_vessels_public(db: Session = Depends(get_db)):
    """
    Public endpoint — returns vessel list for the login dropdown.
    Only returns active vessels, only id + name.
    """
    vessels = (
        db.query(Vessel.id, Vessel.name)
        .filter(Vessel.is_active == True)
        .order_by(Vessel.name)
        .all()
    )
    return [{"id": v.id, "name": v.name} for v in vessels]


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password, data.vessel_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid vessel, username or password")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "full_name": user.full_name,
        "vessel_id": user.vessel_id,
    })

    # Also return vessel name so frontend can display it immediately
    vessel_name = None
    if user.vessel_id:
        vessel = db.query(Vessel).get(user.vessel_id)
        vessel_name = vessel.name if vessel else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "vessel_name": vessel_name,
    }


@router.post("/login/form")
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 form endpoint for Swagger UI. vessel_id defaults to None."""
    user = authenticate_user(db, form_data.username, form_data.password, vessel_id=None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "full_name": user.full_name,
        "vessel_id": user.vessel_id,
    })
    return {"access_token": token, "token_type": "bearer"}