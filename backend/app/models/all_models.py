

from sqlalchemy import Boolean, Column, Integer , Float, ForeignKey, Index,  String,  Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime, timedelta, timezone

VN_TZ = timezone(timedelta(hours=7))

Base = declarative_base()

class WarehouseType(str, enum.Enum):
    CENTRAL = "CENTRAL"
    BRANCH = "BRANCH"



class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="role")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    warehouse_type = Column(SQLEnum(WarehouseType), nullable=False)
    parent_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)

    parent = relationship("Warehouse", remote_side=[id], backref="branches")
    users = relationship("User", back_populates="warehouse")
    stocks = relationship("Stock", back_populates="warehouse")
    inventory_transactions = relationship("InventoryTransaction", backref="warehouse")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)

    role = relationship("Role", back_populates="users")
    warehouse = relationship("Warehouse", back_populates="users")
    inventory_transactions = relationship("InventoryTransaction", backref="user")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable= False)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    base_price = Column(Float, nullable=False)
    attributes = Column(JSONB, default={})

    category = relationship("Category", back_populates="products")
    stocks = relationship("Stock", back_populates="product")
    inventory_ledgers = relationship("InventoryLedger", back_populates="product")
    transaction_details = relationship("TransactionDetail", back_populates="product")

    

    is_active = Column(Boolean, default=True, nullable=False)  # Thêm cột is_active

    __table_args__ = (
        Index(
            'ix_product_name_trgm',                  # Tên index
            'name',                                  # Cột cần đánh index
            postgresql_using='gin',                  # Dùng cơ chế GIN của Postgres
            postgresql_ops={'name': 'gin_trgm_ops'}  # Thuật toán Trigram
        ),
    )

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)

    product = relationship("Product", back_populates="stocks")
    warehouse = relationship("Warehouse", back_populates="stocks")



class TxStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    CANCELED = "CANCELED"

class TxType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    code = Column(String, unique=True, index = True, nullable=False)
    transaction_type = Column(SQLEnum(TxType), nullable=False)
    status = Column(SQLEnum(TxStatus), default=TxStatus.DRAFT, nullable=False)
    cancellation_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(VN_TZ), nullable=False)

    details = relationship("TransactionDetail", back_populates="transaction", cascade="all, delete-orphan")
    inventory_ledgers = relationship("InventoryLedger", back_populates="transaction", cascade="all, delete-orphan")

class TransactionDetail(Base):
    __tablename__ = "transaction_details"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("inventory_transactions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)

    transaction = relationship("InventoryTransaction", back_populates="details")
    product = relationship("Product", back_populates="transaction_details")

class InventoryLedger(Base):
    __tablename__ = "inventory_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("inventory_transactions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    change_quantity = Column(Integer, nullable=False)
    balance_quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(VN_TZ), nullable=False)

    transaction = relationship("InventoryTransaction", back_populates="inventory_ledgers")
    product = relationship("Product", back_populates="inventory_ledgers")

