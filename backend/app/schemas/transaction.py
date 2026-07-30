from pydantic import BaseModel, ConfigDict
from typing import Optional 
from datetime import datetime
from app.models.all_models import TransactionType

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
    model_config = ConfigDict(from_attributes=True)

