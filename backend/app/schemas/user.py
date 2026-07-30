from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    username: str
    password: str
    role_id: int = 2 
    # email: Optional[str] = None
    warehouse_id: Optional[int] = None

class UserCreate(UserBase):
    pass

class UserResponse(BaseModel):
    id: Optional[int] = None
    username: str
    role_id: int
    # email: Optional[str] = None
    warehouse_id: Optional[int] 

    class Config:
        from_attributes = True

