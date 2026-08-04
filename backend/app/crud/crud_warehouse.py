from sqlalchemy.orm import Session
from app.models.all_models import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate

def get_warehouse(db: Session, warehouse_id: int):
    return db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()

def get_warehouses(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        name: str = None,
        parent_id: int = None,
):
    query = db.query(Warehouse).filter(Warehouse.is_active == True)

    if name :
        query = query.filter(Warehouse.name.ilike(f"%{name}%"))
    if parent_id:
        query = query.filter(Warehouse.parent_id == parent_id)

    return query.offset(skip).limit(limit).all()

def create_warehouse(db: Session, warehouse: WarehouseCreate):
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

def update_warehouse(db: Session, warehouse_id: int, warehouse_in: WarehouseUpdate):
    db_warehouse = get_warehouse(db, warehouse_id)
    if db_warehouse is None:
        return None

    update_data = warehouse_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_warehouse, field, value)

    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

def delete_warehouse(db: Session, warehouse_id: int):
    db_warehouse = get_warehouse(db, warehouse_id)
    if db_warehouse is None:
        return None

    db_warehouse.is_active = False
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse