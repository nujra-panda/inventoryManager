# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.base import get_db
from app.db.models import Product, User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(Product)
            .where(Product.owner_id == user.id)
            .order_by(Product.id)
        )
        products = result.scalars().all()
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        # Prevent duplicate names per user (case-insensitive)
        q = select(Product.id).where(
            Product.owner_id == user.id,
            func.lower(Product.name) == func.lower(payload.name),
        )
        existing = (await db.execute(q)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product name already exists")

        prod = Product(
            name=payload.name, 
            stock=payload.stock, 
            owner_id=user.id,
            version=1  # Explicitly set version
        )
        db.add(prod)
        await db.commit()
        await db.refresh(prod)
        return prod
    except HTTPException:
        raise
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Product name already exists")
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.patch("/{product_id}", response_model=ProductOut)
async def update_stock(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        prod = await db.get(Product, product_id)
        if not prod or prod.owner_id != user.id:
            raise HTTPException(status_code=404, detail="Product not found")

        # Optimistic concurrency
        if prod.version != payload.version:
            raise HTTPException(status_code=409, detail="Version conflict. Refetch and retry.")

        if payload.stock is not None:
            # Handle both absolute stock setting and relative changes
            # Based on your frontend, it seems you want relative changes
            new_stock = prod.stock + payload.stock
            prod.stock = max(0, new_stock)

        # Bump version on each successful update
        prod.version = (prod.version or 1) + 1

        await db.commit()
        await db.refresh(prod)
        return prod
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        prod = await db.get(Product, product_id)
        if not prod or prod.owner_id != user.id:
            raise HTTPException(status_code=404, detail="Product not found")
        await db.delete(prod)
        await db.commit()
        return
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )