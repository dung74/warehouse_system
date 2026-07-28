from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class ProductBase(BaseModel):
    sku: str
    name: str
    category_id: int
    base_price: float
    attributes: Optional[Dict[str, Any]] = {}

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


