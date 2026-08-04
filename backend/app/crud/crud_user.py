from sqlalchemy.orm import Session
from app.models.all_models import User
from app.schemas.user import UserCreate, UpdateUserRequest
from app.core.security import get_password_hash

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def read_detail_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        role_id=user.role_id,
        warehouse_id=user.warehouse_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def change_password(db: Session, db_user: User, new_password: str):
    db_user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        role_id: int = None,
        warehouse_id: int = None,
        username: str = None
        ):
    query = db.query(User)
    if role_id is not None:
        query = query.filter(User.role_id == role_id)
    if warehouse_id is not None:
        query = query.filter(User.warehouse_id == warehouse_id)

    if username is not None:
        query = query.filter(User.username.ilike(f"%{username}%"))

    return query.offset(skip).limit(limit).all()

def delete_user(db: Session, user_id: int):
    db_user = read_detail_user(db, user_id)
    if db_user is None:
        return None
    
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_in: UpdateUserRequest):
    db_user = read_detail_user(db, user_id)
    if db_user is None:
        return None
    
    for field, value in user_in.model_dump().items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


