from pydantic import BaseModel, ConfigDict
from typing import Generic, List, Optional, Dict, Any, TypeVar

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
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    base_price: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None


T = TypeVar("T")

class PaginatedProductResponse(BaseModel, Generic[T]):
    total_items: int
    total_pages: int
    current_page: int
    page_size: int
    items: List[T]



    
