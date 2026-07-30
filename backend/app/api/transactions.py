from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud import crud_transaction, crud_product, crud_warehouse
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.models.all_models import User
from app.api.deps import get_current_user
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    # check Product and Warehouse exist
    product = crud_product.get_product(db, transaction.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    warehouse = crud_warehouse.get_warehouse(db, transaction.warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    
    try:
        return crud_transaction.create_transaction(db, transaction, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_transaction.get_transaction(db, skip=skip, limit=limit)