from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.crud import crud_stock
from app.schemas.stock import StockResponse
from app.db.session import get_db

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/", response_model=List[StockResponse])
def read_stocks(warehouse_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_stock.get_stocks(db, warehouse_id=warehouse_id, skip=skip, limit=limit)

