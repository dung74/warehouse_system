from pydantic import BaseModel, ConfigDict

class StockResponse(BaseModel):
    id : int
    product_id: int
    warehouse_id: int 
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class PaginatedStockResponse(BaseModel):
    total: int
    items: list[StockResponse]

