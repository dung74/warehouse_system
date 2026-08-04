from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import  Session

from app.crud import crud_product, crud_category
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate, PaginatedProductResponse
from app.db.session import get_db
from app.api.deps import get_admin_user
from app.models.all_models import User


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
    ):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create product")
    
    if crud_product.get_product_by_sku(db, sku=product.sku):
        raise HTTPException(status_code=400, detail="SKU already exists")

    if not crud_category.get_category(db, category_id=product.category_id):
        raise HTTPException(status_code=400, detail="Category does not exist")

    return crud_product.create_product(db=db, product=product)

@router.get("/", response_model=PaginatedProductResponse[ProductResponse])
def read_products(
    name: Optional[str] = None,
    category_id: Optional[int] = None,
    sort_price: Optional[str] = None,
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1, description="Page number, must be greater than or equal to 1"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page, must be between 1 and 100"),
    db: Session = Depends(get_db)
):
    products = crud_product.get_products(db, name=name, category_id=category_id,
                                         is_active=is_active, sort_price=sort_price, 
                                         page=page, page_size=page_size
                                    )
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete product")
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    crud_product.delete_product(db, product_id=product_id)
    return None

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product_in: ProductUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update product")

    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.sku and product_in.sku != db_product.sku:
        if crud_product.get_product_by_sku(db, sku=product_in.sku):
            raise HTTPException(status_code=400, detail="SKU already exists")

    if product_in.category_id and not crud_category.get_category(db, category_id=product_in.category_id):
        raise HTTPException(status_code=400, detail="Category does not exist")

    return crud_product.update_product(db, product_id=product_id, product_in=product_in)


@router.patch("/{product_id}/restore", response_model=ProductResponse)
def restore_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.is_active:
        raise HTTPException(status_code=400, detail="Product is already active")

    return crud_product.restore_product(db, product_id=product_id)