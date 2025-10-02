from pydantic import BaseModel
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    stock: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    stock: int | None = None
    version: int

class ProductOut(ProductBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True