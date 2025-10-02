from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import StaleDataError

from app.db.base import get_db
from app.db.models import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

from sqlalchemy.future import select
from sqlalchemy import update, delete

router = APIRouter(prefix="/products", tags=["products"])

# Get all products
@router.get("/", response_model=list[ProductOut])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    return result.scalars().all()

# Get one product
@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Create product
@router.post("/", response_model=ProductOut)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    new_product = Product(name=product.name, stock=product.stock)
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

# Delete product
@router.delete("/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Product).where(Product.id == product_id))
    await db.commit()
    return {"message": "Product deleted"}

# Consume or restock stock
@router.post("/{product_id}/update", response_model=ProductOut)
async def update_stock(product_id: int, update: ProductUpdate, db: AsyncSession = Depends(get_db)):
    stmt = (
        update(Product)
        .where(Product.id == product_id, Product.version == update.version)
        .values(stock=Product.stock + update.stock, version=Product.version + 1)
        .execution_options(synchronize_session="fetch")
    )
    try:
        result = await db.execute(stmt)
        await db.commit()
        if result.rowcount == 0:
            raise StaleDataError()
    except StaleDataError:
        raise HTTPException(status_code=409, detail="Version conflict; refetch and retry")

    # Return updated product
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one()
