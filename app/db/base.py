# app/db/base.py
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./inventory.db")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)  # echo=True for debugging

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False, autocommit=False
)

Base = declarative_base()

async def init_db():
    """Initialize database, create tables"""
    async with engine.begin() as conn:
        # Drop all tables for clean start (in development)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session