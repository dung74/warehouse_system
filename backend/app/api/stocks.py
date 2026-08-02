from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.crud import crud_stock
from app.schemas.stock import StockResponse, PaginatedStockResponse
from app.db.session import get_db

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/", response_model=PaginatedStockResponse)
def read_stocks(
    warehouse_id: Optional[int] = None, 
    product_name: Optional[str] = None,
    sort_desc: Optional[bool] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)):

    result = crud_stock.get_stocks(
        db, 
        warehouse_id=warehouse_id, 
        product_name=product_name, 
        sort_desc=sort_desc, 
        skip=skip, 
        limit=limit
    )
    return result