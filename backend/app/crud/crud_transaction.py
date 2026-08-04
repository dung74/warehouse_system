from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.models.all_models import InventoryTransaction, TransactionDetail, Product, TxType, TxStatus, Stock, InventoryLedger

from app.schemas.transaction import InventoryTransactionCreate

VN_TZ = timezone(timedelta(hours=7))


def get_transaction(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: TxStatus = None,
        warehouse_id: int = None,
        start_date: datetime = None,
        end_date: datetime = None
):
    query = db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.details).joinedload(TransactionDetail.product)
    )
    if warehouse_id:
        query = query.filter(InventoryTransaction.warehouse_id == warehouse_id)

    if status:
        query = query.filter(InventoryTransaction.status == status)
    if start_date:
        query = query.filter(InventoryTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(InventoryTransaction.created_at <= end_date)

    total = query.count()
    items = query.order_by(InventoryTransaction.created_at.desc()).offset(skip).limit(limit).all()
    return total, items


def create_draft_transaction(db: Session, schema: InventoryTransactionCreate, user_id: int):

    prefix = "IN" if schema.transaction_type == TxType.IN else "OUT"
    tx_code = f"{prefix}{datetime.now(VN_TZ).strftime('%Y%m%d%H%M%S')}"

    db_transaction = InventoryTransaction(
        code=tx_code,
        transaction_type=schema.transaction_type,
        status=TxStatus.DRAFT,
        warehouse_id=schema.warehouse_id,
        user_id=user_id
    )

    db.add(db_transaction)
    db.flush()

    for detail in schema.details:
        db_detail = TransactionDetail(
            transaction_id=db_transaction.id,
            product_id=detail.product_id,
            quantity=detail.quantity
        )
        db.add(db_detail)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def approve_transaction(db: Session, transaction_id: int):
    tx = db.query(InventoryTransaction).filter(
        InventoryTransaction.id == transaction_id,
    ).with_for_update().first()

    if not tx:
        raise ValueError("Transaction not found")
    if tx.status != TxStatus.DRAFT:
        raise ValueError("Only DRAFT transactions can be approved")

    for detail in tx.details:
        stock = db.query(Stock).filter(
            Stock.product_id == detail.product_id,
            Stock.warehouse_id == tx.warehouse_id
        ).with_for_update().first()

        if tx.transaction_type == TxType.IN:
            if stock:
                stock.quantity += detail.quantity
            else:
                stock = Stock(
                    product_id=detail.product_id,
                    warehouse_id=tx.warehouse_id,
                    quantity=detail.quantity
                )
                db.add(stock)
                db.flush()
        elif tx.transaction_type == TxType.OUT:
            if not stock or stock.quantity < detail.quantity:
                raise ValueError(f"Not enough stock for product_id {detail.product_id} in warehouse_id {tx.warehouse_id}")
            stock.quantity -= detail.quantity

        change_quantity = detail.quantity if tx.transaction_type == TxType.IN else -detail.quantity
        ledger = InventoryLedger(
            transaction_id=tx.id, 
            product_id=detail.product_id,
            change_quantity=change_quantity,
            balance_quantity=stock.quantity,
        )
        db.add(ledger)

    tx.status = TxStatus.APPROVED
    db.commit()
    db.refresh(tx)
    return tx


def cancel_transaction(db: Session, transaction_id: int, cancellation_reason: str):
    tx = db.query(InventoryTransaction).filter(
        InventoryTransaction.id == transaction_id,
    ).with_for_update().first()

    if not tx:
        raise ValueError("Transaction not found")
    if tx.status == TxStatus.CANCELED:
        raise ValueError("Transaction is already canceled")

    if tx.status == TxStatus.APPROVED:
        for detail in tx.details:
            stock = db.query(Stock).filter(
                Stock.product_id == detail.product_id,
                Stock.warehouse_id == tx.warehouse_id,
            ).with_for_update().first()

            if tx.transaction_type == TxType.IN:
                if not stock or stock.quantity < detail.quantity:
                    raise ValueError(f"cannot cancel transaction due to this prroduct id: {detail.product_id} in warehouse id: {tx.warehouse_id} has been sent out, not enough stock to revert the IN transaction")
                stock.quantity -= detail.quantity
            else:
                stock.quantity += detail.quantity

            reversal_change_quantity = -detail.quantity if tx.transaction_type == TxType.IN else detail.quantity
            ledger = InventoryLedger(
                transaction_id=tx.id,
                product_id=detail.product_id,
                change_quantity=reversal_change_quantity,
                balance_quantity=stock.quantity
            )
            db.add(ledger)

    tx.status = TxStatus.CANCELED
    tx.cancellation_reason = cancellation_reason
    db.commit()
    db.refresh(tx)
    return tx
