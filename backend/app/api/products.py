from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import crud_product, crud_category
from app.schemas.product import ProductCreate, ProductResponse
from app.db.session import get_db


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):

    if crud_product.get_product_by_sku(db, sku=product.sku):
        raise HTTPException(status_code=400, detail="SKU already exists")

    if not crud_category.get_category(db, category_id=product.category_id):
        raise HTTPException(status_code=400, detail="Category does not exist")

    return crud_product.create_product(db=db, product=product)

@router.get("/", response_model=List[ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud_product.get_products(db, skip=skip, limit=limit)
    return products

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    crud_product.delete_product(db, product_id=product_id)
    return None
    