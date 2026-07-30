from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.all_models import User
from app.schemas.user import UserCreate, UserResponse
from app.crud import crud_user
from app.api.deps import get_admin_user

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_admin: User = Depends(get_admin_user)):
    users = db.query(User).all()
    return users


@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)

):
    existing_user = crud_user.get_user_by_username(db, username=user_in.username)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered",
        )
    return crud_user.create_user(db=db, user=user_in)

