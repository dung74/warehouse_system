

from sqlalchemy import Column, Integer , Float, ForeignKey, Index,  String,  Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime, timedelta, timezone

VN_TZ = timezone(timedelta(hours=7))

Base = declarative_base()

class WarehouseType(str, enum.Enum):
    CENTRAL = "CENTRAL"
    BRANCH = "BRANCH"

class TransactionType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"

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
    transactions = relationship("Transaction", back_populates="warehouse")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)

    role = relationship("Role", back_populates="users")
    warehouse = relationship("Warehouse", back_populates="users")
    transactions = relationship("Transaction", back_populates="user")

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
    transactions = relationship("Transaction", back_populates="product")

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


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reference_code = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.now(VN_TZ))


    product = relationship("Product", back_populates="transactions")
    warehouse = relationship("Warehouse", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
