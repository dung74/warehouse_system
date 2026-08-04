from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.all_models import User
from app.schemas.user import UserCreate, UserResponse, ChangePasswordRequest, UpdateUserRequest
from app.crud import crud_user
from app.api.deps import get_admin_user, get_current_user
from app.core.security import verify_password

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = Query(0),
    limit: int = Query(100),
    role_id: Optional[int] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    username: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)

):
    users = crud_user.get_users(
        db=db, 
        skip=skip, 
        limit=limit, 
        role_id=role_id, 
        warehouse_id=warehouse_id, 
        username=username
    )
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
    existing_email = crud_user.get_user_by_email(db, email=user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    return crud_user.create_user(db=db, user=user_in)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect",
        )

    if request.old_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the old password",
        )

    crud_user.change_password(db, current_user, request.new_password)
    return {"detail": "Password changed successfully"}


@router.get("/{user_id}", response_model=UserResponse)
def read_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = crud_user.read_detail_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_admin_user)
    ):
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin users cannot delete themselves."
        )
    user = crud_user.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user_in: UpdateUserRequest, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_admin_user)
    ):
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin users cannot update themselves."
        )
    if user_in.username:
        existing_user = crud_user.get_user_by_username(db, username=user_in.username)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=400,
                detail="Username already registered",
            )
    if user_in.email:
        existing_email = crud_user.get_user_by_email(db, email=user_in.email)
        if existing_email and existing_email.id != user_id:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )
    user = crud_user.update_user(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user