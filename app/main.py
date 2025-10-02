from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import engine, Base
from app.routers import products
import asyncio

app = FastAPI(title="Inventory Tracker")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)

# Create tables on startup (SQLite dev)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init_db())
