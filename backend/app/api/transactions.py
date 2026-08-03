from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from app.crud import crud_transaction, crud_warehouse
from app.db.session import get_db

from app.models.all_models import User, TxStatus
from app.api.deps import get_current_user

from app.schemas.transaction import (
    InventoryTransactionCreate,
    InventoryTransactionResponse,
    PaginatedTransactionResponse,
    TransactionCancelRequest,

)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    schema: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = crud_warehouse.get_warehouse(db, schema.warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    try: 
        return crud_transaction.create_draft_transaction(db, schema, current_user.id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=" Transaction creation failed due to integrity error.")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{transaction_id}/approve", response_model=InventoryTransactionResponse)
def approve_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try: 
        # if current_user.role.name != "ADMIN": raise HTTPException(...)
        return crud_transaction.approve_transaction(db, transaction_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{transaction_id}/cancel", response_model=InventoryTransactionResponse)
def cancel_transaction(
    transaction_id: int,
    payload: TransactionCancelRequest,
    db: Session = Depends(get_db),
    currnt_user: User = Depends(get_current_user),
):
    try:
        return crud_transaction.cancel_transaction(db, transaction_id, payload.cancellation_reason)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=PaginatedTransactionResponse)
def read_transactions(
    skip: int = 0,
    limit: int = 10,
    status: Optional[TxStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try: 
        total, items = crud_transaction.get_transaction(
            db=db,
            skip=skip,
            limit=limit,
            status=status,
            start_date=start_date,
            end_date=end_date
        )
        return {"total": total, "items": items}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))