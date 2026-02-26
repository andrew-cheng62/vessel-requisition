from app.db import base
from app.db.session import SessionLocal
from app.models.user import User
from app.auth import hash_password

db = SessionLocal()

username = "akikott"          # change as needed
full_name = "Super Admin"   # change as needed
password = "andrewkikott"   # change to something strong

# Check if already exists
existing = db.query(User).filter(
    User.username == username,
    User.vessel_id == None
).first()

if existing:
    print(f"User '{username}' already exists")
else:
    user = User(
        username=username,
        full_name=full_name,
        role="super_admin",
        password_hash=hash_password(password),
        vessel_id=None,   # super_admin has no vessel
    )
    db.add(user)
    db.commit()
    print(f"Super admin '{username}' created successfully")

db.close()