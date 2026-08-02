
from datetime import datetime

from sqlalchemy.orm import Session, contains_eager, joinedload
from app.models.all_models import Transaction, Stock, TransactionType, Product
from app.schemas.transaction import TransactionCreate


def get_transaction(db: Session, 
                    skip: int = 0, 
                    limit: int = 100, 
                    product_name: str = None,
                    start_date: datetime = None,
                    end_date: datetime = None
                ):
    query = db.query(Transaction)

    if product_name:
        query = query.join(Product, Transaction.product_id == Product.id)
        query = query.filter(Product.name.ilike(f"%{product_name}%"))

        query = query.options(contains_eager(Transaction.product))
    else:
        query = query.options(joinedload(Transaction.product))

    if start_date:
        query = query.filter(Transaction.timestamp >= start_date)
    if end_date:
        query = query.filter(Transaction.timestamp <= end_date)

    total = query.count()
    items = query.order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()

    return total, items


def create_transaction(db: Session, transaction: TransactionCreate, user_id: int):

    stock = db.query(Stock).filter(
        Stock.product_id == transaction.product_id,
        Stock.warehouse_id == transaction.warehouse_id
    ).with_for_update().first()


    if transaction.transaction_type == TransactionType.IN:
        if stock:
            stock.quantity += transaction.quantity_change
        else:
            new_stock = Stock(
                product_id=transaction.product_id,
                warehouse_id=transaction.warehouse_id,
                quantity=transaction.quantity_change
            )
            db.add(new_stock)
    elif transaction.transaction_type == TransactionType.OUT:
        if not stock or stock.quantity < transaction.quantity_change:
            raise ValueError("Quantity of stock is insufficient for the transaction.")
        stock.quantity -= transaction.quantity_change


    db_transaction = Transaction(
        product_id=transaction.product_id,
        warehouse_id=transaction.warehouse_id,
        transaction_type=transaction.transaction_type,
        quantity_change=transaction.quantity_change,
        reference_code=transaction.reference_code,
        user_id=user_id
    )
    db.add(db_transaction)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction