from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.all_models import WarehouseType

class WarehouseBase(BaseModel):
    name: str
    warehouse_type: WarehouseType
    parent_id: Optional[int] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

