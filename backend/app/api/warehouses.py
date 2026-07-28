from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.crud import crud_warehouse
from app.schemas.warehouse import WarehouseResponse, WarehouseCreate
from app.db.session import get_db

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@router.post("/", response_model=WarehouseResponse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    return crud_warehouse.create_warehouse(db=db, warehouse=warehouse)


@router.get("/", response_model=List[WarehouseResponse])
def read_warehouses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_warehouse.get_warehouses(db, skip=skip, limit=limit)
