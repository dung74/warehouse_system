import math

from sqlalchemy.orm import Session
from app.models.all_models import Product
from app.schemas.product import ProductCreate, ProductUpdate
from sqlalchemy.exc import SQLAlchemyError


def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()

def get_products(
        db: Session, 
        name: str = None,
        category_id: int = None,
        sort_price: str = None,
        page: int = 1,
        page_size: int = 10,
        is_active: bool = True
    ):
    query = db.query(Product)

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    if name: 
        query = query.filter(Product.name.ilike(f"%{name}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    total_items = query.count()
    total_pages = math.ceil(total_items / page_size) if page_size > 0 else 0

    if sort_price == "asc":
        query = query.order_by(Product.base_price.asc())
    elif sort_price == "desc":
        query = query.order_by(Product.base_price.desc())

    skip = (page - 1) * page_size
    items = query.offset(skip).limit(page_size).all()

    return {
        "total_items": total_items,
        "total_pages": total_pages,
        "current_page": page,
        "page_size": page_size,
        "items": items
    }



def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product_in: ProductUpdate):
    db_product = get_product(db, product_id)

    if not db_product:
        return None
    update_data = product_in.model_dump(exclude_unset=True)

    if not update_data:
        return db_product

    for field, value in update_data.items():
        setattr(db_product, field, value)

    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if db_product:
        db_product.is_active = False  # Mark the product as inactive instead of deleting it
        db.commit()
        db.refresh(db_product)
    return db_product

def restore_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if db_product and not db_product.is_active:
        db_product.is_active = True  # Restore the product by marking it as active
        db.commit()
        db.refresh(db_product)
    return db_product

