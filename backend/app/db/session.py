from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/db_inventory"


engine = create_engine(
    SQLALCHEMY_DATABASE_URL  # Only needed for SQLite. Remove this line for other databases.
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()