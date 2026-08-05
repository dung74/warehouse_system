# Warehouse System

Warehouse System is a full-stack warehouse and inventory management application. It helps businesses manage products, categories, warehouses, stock levels, users, and inventory transactions in one place.

The project is split into:
- a **FastAPI** backend
- a **React + Vite** frontend
- a **PostgreSQL** database
- **Docker Compose** for local deployment

---

## Features

### Authentication & Authorization
- Login with JWT access tokens
- Role-based access control
- Admin-only management areas
- Password change feature for logged-in users

### Product Management
- Create, update, delete, and restore products
- Search products by name
- Filter by category and active status
- Paginated product listing
- Product image upload
- Dynamic product attributes stored as JSON

### Category Management
- List categories
- Create new categories
- Delete categories with protection against removing categories that still contain products

### Warehouse Management
- Create and update warehouses
- View warehouse details
- Search warehouses by name and parent warehouse
- Support for central and branch warehouse structures
- Soft delete via active/inactive status

### Inventory / Stock Management
- View inventory by warehouse
- Search stock by product name
- Sort stock by quantity
- Paginated stock listing

### Inventory Transactions
- Create draft inbound/outbound transactions
- Approve transactions to update stock automatically
- Cancel approved transactions with stock reversal
- Filter transactions by status, warehouse, and date range
- Transaction ledger history for traceability

### User Management
- List, create, edit, and deactivate users
- Filter users by role, warehouse, and username
- Prevent admins from deleting or editing themselves

### File Upload
- Upload product images
- Store uploaded files under the backend static directory

---

## Technology Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React

### Backend
- FastAPI
- SQLAlchemy 2
- Pydantic
- PostgreSQL
- JWT authentication with `python-jose`
- Password hashing with `passlib` / `bcrypt`

### DevOps / Runtime
- Docker
- Docker Compose
- Nginx for serving the frontend container

---

## System Roles

The application uses role-based access:

- **Admin**: full management access to warehouses, users, transactions, categories, and products
- **Staff**: access limited to their own warehouse data and personal transaction views

The seeded roles are:
1. Admin
2. User

---

## Project Structure

```text
warehouse_system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── db/
│   │   ├── models/
│   │   └── schemas/
│   ├── static/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── db_init/
├── docker-compose.yaml
├── seed_data.sql
└── README.md
```

---

## Prerequisites

- Docker and Docker Compose
- Or, for local development:
  - Python 3.10+
  - Node.js 18+
  - PostgreSQL 15+

---

## Quick Start with Docker

### 1) Configure environment variables

Update the backend environment file if needed. A typical Docker setup looks like this:

```env
SQLALCHEMY_DATABASE_URL=postgresql://<username>:<password>@db:5432/db_inventory
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_DB=db_inventory
```

The frontend uses:

```env
VITE_API_Base_URL=http://localhost:8000/api
VITE_IMAGE_BASE_URL=http://localhost:8000/
```

### 2) Start the stack

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port `5433`
- FastAPI backend on port `8000`
- React frontend on port `3000`

### 3) Seed the database

After the database container is running, import the sample data:

```bash
cat seed_data.sql | docker exec -i wms_db psql -U postgres -d db_inventory
```
admin acount: 'admin'  mk: '123456'

### 4) Open the application

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

---

## Local Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

Make sure PostgreSQL is running, then:
- create the database defined in `SQLALCHEMY_DATABASE_URL`
- enable the `pg_trgm` extension using `db_init/01_extension.sql`
- import `seed_data.sql` if you want the sample records

---

## Default Accounts

The seed file includes demo accounts with password `123456`:

| Username | Role |
| --- | --- |
| `admin` | Admin |
| `user` | User |

---

## Main API Modules

- `auth` - login and current user info
- `users` - user management and password change
- `categories` - category management
- `products` - product CRUD, filtering, restore
- `warehouses` - warehouse CRUD and detail views
- `stocks` - inventory listing
- `transactions` - draft / approve / cancel inventory transactions
- `upload` - image upload

---

## Notes

- The backend serves uploaded files from `/static`.
- Product name search uses PostgreSQL trigram indexing.
- Inventory transactions automatically update stock and create ledger records when approved or reversed.
- The frontend stores the JWT token and user profile data in `localStorage` for session persistence.

---

## License

No license has been defined for this project yet.

