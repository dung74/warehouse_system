from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import categories, products, warehouses, stocks, transactions, auth, users, upload, chat
from app.models.all_models import Base
from app.db.session import engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Management System")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(warehouses.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Inventory Management System API"}
