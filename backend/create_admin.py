from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

username = "captain"
password = "captain123"  # change later

hashed = pwd_context.hash(password)

user = User(
    username=username,
    full_name="Vessel Captain",
    role="CAPTAIN",
    password_hash=hashed
)

db.add(user)
db.commit()
db.close()

print("Captain user created")
