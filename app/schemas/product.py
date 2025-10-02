from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    stock: int = 0

class ProductUpdate(BaseModel):
    stock: int
    version: int  # Required for optimistic concurrency

class ProductOut(BaseModel):
    id: int
    name: str
    stock: int
    version: int

    class Config:
        orm_mode = True
