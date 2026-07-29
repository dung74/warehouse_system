from sqlalchemy.orm import Session
from app.models.all_models import Transaction, Stock, TransactionType
from app.schemas.transaction import TransactionCreate


def get_transaction(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Transaction).order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: TransactionCreate):

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
        user_id=transaction.user_id
    )
    db.add(db_transaction)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction