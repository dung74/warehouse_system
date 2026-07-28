from sqlalchemy.orm import Session
from app.models.all_models import Warehouse
from app.schemas.warehouse import WarehouseCreate

def get_warehouse(db: Session, warehouse_id: int):
    return db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()

def get_warehouses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Warehouse).offset(skip).limit(limit).all()

def create_warehouse(db: Session, warehouse: WarehouseCreate):
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

