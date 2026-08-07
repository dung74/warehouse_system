# Warehouse System

Warehouse System is a full-stack warehouse management application covering products, categories, warehouses, stock, inbound/outbound transactions, users, and an internal **RAG chatbot** for warehouse policy and process Q&A.

## Key Features

### 1) Authentication & Authorization
- Login with JWT access token
- Role-based access control
- Admin-only management areas
- Password change for authenticated users

### 2) Product Management
- Create / update / soft-delete / restore products
- Search products by name
- Filter by category and active status
- Paginated product listing
- Product image upload
- Dynamic product attributes (`JSONB`)

### 3) Category Management
- List categories
- Create new categories
- Delete categories with related-data constraints

### 4) Warehouse Management
- Create and update warehouses
- View warehouse details
- Search by warehouse name and parent warehouse
- Support central/branch warehouse model

### 5) Inventory Management
- View stock by warehouse
- Search stock by product name
- Sort by quantity
- Paginated stock listing

### 6) Inbound/Outbound Transactions
- Create draft transactions (IN/OUT)
- Approve transactions to update stock automatically
- Cancel approved transactions with stock rollback
- Filter by status, warehouse, and date
- Inventory ledger history for traceability

### 7) User Management
- List / create / update / deactivate users
- Filter by role, warehouse, and username
- Prevent admins from updating or deleting themselves

### 8) Internal Chatbot (RAG)
- Floating chat widget in UI (`🤖 WMS Assistant`)
- Backend endpoint: `POST /api/chat/` (JWT required)
- Context retrieval from FAISS index (internal PDF documents)
- Embeddings via Ollama model `qwen3-embedding:0.6b`
- Response generation via Google Gemini (`gemini-2.5-flash`)

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
- JWT (`python-jose`)
- Password hashing (`passlib` + `bcrypt`)
- LangChain + FAISS + Ollama Embeddings + Google GenAI

### Runtime / Deployment
- Docker + Docker Compose
- Nginx (serving frontend build)

## System Roles

- **Admin**: full management permissions (warehouses, users, transactions, categories, products, etc.)
- **User/Staff**: restricted to assigned warehouse scope and personal data access

Default seeded roles:
1. Admin
2. User

## Project Structure

```text
warehouse_system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── data/            # Internal policy/process PDFs + FAISS index
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/        # RAG service
│   ├── build_faiss.py       # Vector index build script
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

## Prerequisites

- Docker + Docker Compose (for containerized setup), or
- Local development:
  - Python 3.10+
  - Node.js 18+
  - PostgreSQL 15+
- For chatbot support:
  - Ollama running (default port `11434`)
  - Embedding model available: `qwen3-embedding:0.6b`
  - Valid `GOOGLE_API_KEY`

## Environment Configuration

### Backend (`backend/.env`)

See `backend/.env.example`:

```env
SQLALCHEMY_DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

POSTGRES_USER=your_postgres_username
POSTGRES_PASSWORD=password
POSTGRES_DB=your_postgres_database_name

GOOGLE_API_KEY=your_google_api_key_here
```

### Frontend (`frontend/.env`)

See `frontend/.env.example`:

```env
VITE_API_Base_URL=http://localhost:8000/api
VITE_IMAGE_BASE_URL=http://localhost:8000/
```

## Quick Start with Docker

### 1) Start Ollama (for chatbot)

```bash
ollama serve
ollama pull qwen3-embedding:0.6b
```

> Note: backend in Docker connects to Ollama via `host.docker.internal:11434`.

### 2) Build FAISS index from internal documents

Put policy/process PDF files into `backend/app/data`, then run:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build_faiss.py
```

### 3) Start the stack

```bash
docker compose up --build
```

Default services:
- PostgreSQL: `localhost:5433`
- Backend API: `localhost:8000`
- Frontend: `localhost:3000`

### 4) Seed sample data

```bash
cat seed_data.sql | docker exec -i wms_db psql -U postgres -d db_inventory
```

### 5) Access

- Frontend: http://localhost:3000
- Swagger: http://localhost:8000/docs

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build_faiss.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> Note: in the current code, the RAG service calls Ollama via `host.docker.internal:11434`. If you run backend purely local and this host is not resolvable, update the Ollama endpoint for your environment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

- Create the database defined in `SQLALCHEMY_DATABASE_URL`.
- Ensure extension `pg_trgm` is enabled (script in `db_init/01_extension.sql`).
- Import `seed_data.sql` if you need sample data.

## Default Seed Accounts

Default password: `123456`

| Username | Role |
| --- | --- |
| `admin` | Admin |
| `user` | User |

## Main API Modules

- `auth`: login and current-user info
- `users`: user management and password change
- `categories`: category management
- `products`: product CRUD + filtering + restore
- `warehouses`: warehouse management
- `stocks`: stock viewing/search/filtering
- `transactions`: create draft, approve, cancel inventory transactions
- `upload`: product image upload
- `chat`: internal chatbot Q&A

## Chatbot Operation Notes

- Chat route requires a valid token (`Depends(get_current_user)`).
- If FAISS index is missing at `backend/app/data/faiss_index`, chatbot requests will fail.
- Answer quality depends on PDF document content in `backend/app/data`.

## License

No license has been defined yet.
