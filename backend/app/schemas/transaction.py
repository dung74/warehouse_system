from pydantic import BaseModel, ConfigDict
from typing import Optional 
from datetime import datetime
from app.models.all_models import TransactionType


class ProductShortInfo(BaseModel):
    id: int
    sku: str
    name: str
    model_config = ConfigDict(from_attributes=True)

class TransactionBase(BaseModel):
    product_id: int
    warehouse_id: int
    transaction_type: TransactionType
    quantity_change: int
    reference_code: Optional[str] = None
    # user_id: int

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime
    product: ProductShortInfo
    model_config = ConfigDict(from_attributes=True)

class PaginatedTransactionResponse(BaseModel):
    total: int
    items: list[TransactionResponse]