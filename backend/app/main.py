from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.routers import companies, items, auth, requisitions, categories, vessels, users, tags
import app.models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vessels.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(items.router)
app.include_router(requisitions.router)
app.include_router(categories.router)
app.include_router(tags.router)

app.mount("/media", StaticFiles(directory="media"), name="media")

@app.get("/")
def health():
    return {"status": "ok"}
