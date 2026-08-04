from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import  Session
from app.crud import crud_warehouse
from app.schemas.warehouse import WarehouseResponse, WarehouseCreate, WarehouseDetailResponse, WarehouseUpdate
from app.db.session import get_db
from app.api.deps import get_admin_user
from app.models.all_models import User

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@router.post("/", response_model=WarehouseResponse)
def create_warehouse(
    warehouse: WarehouseCreate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
    ):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create warehouse")
    return crud_warehouse.create_warehouse(db=db, warehouse=warehouse)


@router.get("/", response_model=List[WarehouseResponse])
def read_warehouses(
    skip: int = 0, 
    limit: int = 100, 
    name: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return crud_warehouse.get_warehouses(db=db, skip=skip, limit=limit, name=name, parent_id=parent_id)

@router.get("/{warehouse_id}", response_model=WarehouseDetailResponse)
def read_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    db_warehouse = crud_warehouse.get_warehouse(db=db, warehouse_id=warehouse_id)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int, 
    warehouse_in: WarehouseUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
    ):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update warehouse")
    db_warehouse = crud_warehouse.update_warehouse(db=db, warehouse_id=warehouse_id, warehouse_in=warehouse_in)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse

@router.delete("/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete warehouse")
    db_warehouse = crud_warehouse.delete_warehouse(db=db, warehouse_id=warehouse_id)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"detail": "Warehouse deleted successfully"}
