from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

username = "crew"
password = "crewcrew"  # change later

hashed = pwd_context.hash(password)

user = User(
    username=username,
    full_name="Vessel Gaye",
    role="CREW",
    password_hash=hashed
)

db.add(user)
db.commit()
db.close()

print("Crew user created")
