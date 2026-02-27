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
    vessel_id: Optional[int] = None


@router.get("/vessels/public", tags=["Auth"])
def list_vessels_public(db: Session = Depends(get_db)):
    """Public endpoint — returns vessel list for the login dropdown."""
    vessels = (
        db.query(Vessel.id, Vessel.name)
        .filter(Vessel.is_active == True)
        .order_by(Vessel.name)
        .all()
    )
    return [{"id": v.id, "name": v.name} for v in vessels]


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """JSON login — used by the frontend."""
    user = authenticate_user(db, data.username, data.password, data.vessel_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid vessel, username or password")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "full_name": user.full_name,
        "vessel_id": user.vessel_id,
    })

    vessel_name = None
    if user.vessel_id:
        vessel = db.get(Vessel, user.vessel_id)
        vessel_name = vessel.name if vessel else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "vessel_name": vessel_name,
    }


@router.post("/login/form")
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 form login — used exclusively by Swagger UI.
    Logs in as super_admin (vessel_id=None) by default.
    To log in as a vessel user, put vessel_id in the 'username' field
    as 'username:vessel_id', e.g. 'john:1'
    """
    username = form_data.username
    vessel_id = None

    # Support 'username:vessel_id' format for testing vessel users in Swagger
    if ":" in username:
        parts = username.split(":", 1)
        username = parts[0]
        try:
            vessel_id = int(parts[1])
        except ValueError:
            vessel_id = None

    user = authenticate_user(db, username, form_data.password, vessel_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. For vessel users use 'username:vessel_id' format"
        )

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "full_name": user.full_name,
        "vessel_id": user.vessel_id,
    })

    return {"access_token": token, "token_type": "bearer"}
