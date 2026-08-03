from pydantic import BaseModel, ConfigDict

class ProductShortInfo(BaseModel):
    id: int
    sku: str
    name: str
    model_config = ConfigDict(from_attributes=True)

class StockResponse(BaseModel):
    id : int
    product_id: int
    warehouse_id: int 
    quantity: int

    product: ProductShortInfo

    model_config = ConfigDict(from_attributes=True)


class PaginatedStockResponse(BaseModel):
    total: int
    items: list[StockResponse]

