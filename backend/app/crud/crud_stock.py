from sqlalchemy.orm import Session
from app.models.all_models import Stock

def get_stocks(db: Session, warehouse_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Stock)
    if warehouse_id:
        query = query.filter(Stock.warehouse_id == warehouse_id)
    return query.offset(skip).limit(limit).all()


