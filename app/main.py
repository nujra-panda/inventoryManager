# app/main.py
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db.base import engine, Base
from app.routers import products, auth

APP_TITLE = "Inventory Tracker"
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
INDEX_HTML = STATIC_DIR / "index.html"
LOGIN_HTML = STATIC_DIR / "login.html"

app = FastAPI(title=APP_TITLE)

# Static assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# CORS (wide-open for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pages
@app.get("/")
async def index():
    return FileResponse(INDEX_HTML)

@app.get("/login")
async def login_page():
    return FileResponse(LOGIN_HTML)

# API routers
app.include_router(products.router)
app.include_router(auth.router)

# DB init
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
