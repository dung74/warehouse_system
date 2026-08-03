from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import crud_category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.db.session import get_db
from app.api.deps import get_admin_user


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = crud_category.get_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Category name already registered")
    return crud_category.create_category(db=db, category=category)

@router.get("/", response_model=List[CategoryResponse])
def read_categories(skip: int = 0, limit: int=100, db: Session = Depends(get_db)):
    categories = crud_category.get_categories(db, skip=skip, limit=limit)
    return categories

@router.get("/{category_id}", response_model=CategoryResponse)
def read_category(category_id: int, db: Session = Depends(get_db)):
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), current_admin = Depends(get_admin_user)):
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete category")
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    crud_category.delete_category(db, category_id=category_id)
    return None
