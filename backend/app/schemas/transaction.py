from pydantic import BaseModel, ConfigDict
from typing import Optional 
from datetime import datetime
from app.models.all_models import TxType, TxStatus


class ProductShortInfo(BaseModel):
    id: int
    sku: str
    name: str
    model_config = ConfigDict(from_attributes=True)



class TransactionDetailCreate(BaseModel):
    product_id: int
    quantity: int

class TransactionDetailResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    product: Optional[ProductShortInfo] = None

    model_config = ConfigDict(from_attributes=True)


class InventoryTransactionBase(BaseModel):

    transaction_type: TxType
    warehouse_id: int

class InventoryTransactionCreate(InventoryTransactionBase):
    details: list[TransactionDetailCreate]

class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    code: str
    status: TxStatus
    cancellation_reason: Optional[str] = None
    created_at: datetime
    details: list[TransactionDetailResponse]

    model_config = ConfigDict(from_attributes=True)

class TransactionCancelRequest(BaseModel):
    cancellation_reason: str

class PaginatedTransactionResponse(BaseModel):
    total: int
    items: list[InventoryTransactionResponse]