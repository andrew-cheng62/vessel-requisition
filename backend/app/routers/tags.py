from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth import get_current_user, require_super_admin
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagOut, TagCreate, TagUpdate
import re

router = APIRouter(prefix="/tags", tags=["Tags"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def make_slug(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower().strip()).strip('-')


@router.get("/", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Tag).order_by(Tag.name).all()


@router.post("/", response_model=TagOut, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    slug = make_slug(data.name)
    if db.query(Tag).filter(Tag.slug == slug).first():
        raise HTTPException(400, "Tag already exists")
    tag = Tag(name=data.name, slug=slug, color=data.color or "#6b7280")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: int,
    data: TagUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(404, "Tag not found")
    if data.name:
        tag.name = data.name
        tag.slug = make_slug(data.name)
    if data.color:
        tag.color = data.color
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(404, "Tag not found")
    db.delete(tag)
    db.commit()
    return {"status": "deleted"}
