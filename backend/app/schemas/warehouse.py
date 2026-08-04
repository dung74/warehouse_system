from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.all_models import WarehouseType
from app.schemas.stock import ProductShortInfo


class WarehouseBase(BaseModel):
    name: str
    warehouse_type: WarehouseType
    parent_id: Optional[int] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    is_active: bool 

    model_config = ConfigDict(from_attributes=True)

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    warehouse_type: Optional[WarehouseType] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class WarehouseChildInfo(BaseModel):
    id: int
    name: str
    warehouse_type: WarehouseType
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserShortInfo(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
class StockInfo(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductShortInfo

    model_config = ConfigDict(from_attributes=True)

class WarehouseDetailResponse(WarehouseResponse):
    parent: Optional[WarehouseChildInfo] = None
    branches: list[WarehouseChildInfo] = []
    users: list[UserShortInfo] = []
    stocks: list[StockInfo] = []

    model_config = ConfigDict(from_attributes=True)
