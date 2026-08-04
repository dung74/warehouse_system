from pydantic import BaseModel, ConfigDict
from typing import Generic, List, Optional, Dict, Any, TypeVar
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    category_id: int
    base_price: float
    attributes: Optional[Dict[str, Any]] = {}
    description: Optional[str] = None
    image_path: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    base_price: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    image_path: Optional[str] = None


T = TypeVar("T")

class PaginatedProductResponse(BaseModel, Generic[T]):
    total_items: int
    total_pages: int
    current_page: int
    page_size: int
    items: List[T]



    
