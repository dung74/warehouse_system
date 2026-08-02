from sqlalchemy.orm import Session, contains_eager
from app.models.all_models import Stock, Product

def get_stocks(
        db: Session, 
        warehouse_id: int = None, 
        product_name: str = None,
        sort_desc: bool = None,
        skip: int = 0, 
        limit: int = 100
        ):
    
    query = (
        db.query(Stock)
        .join(Product, Stock.product_id == Product.id)
        .options(contains_eager(Stock.product))
    )

    if warehouse_id:
        query = query.filter(Stock.warehouse_id == warehouse_id)

    if product_name:
        query = query.filter(Product.name.ilike(f"%{product_name}%"))

    if sort_desc is True:
        query = query.order_by(Stock.quantity.desc())
    elif sort_desc is False:
        query = query.order_by(Stock.quantity.asc())

    total_rows = query.count()

    items = query.offset(skip).limit(limit).all()

    return {
        "total": total_rows,
        "items": items
    }




