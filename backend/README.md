# AI Commerce Platform — Backend

Backend foundation for the Razorpay Buildathon 2026 "AI Commerce" project, built with
FastAPI, SQLAlchemy 2.x, and PostgreSQL.

> **Scope of this step:** database models, CRUD APIs for products/merchants/orders,
> read API for audit logs, seed data, and migrations. The AI shopping agent,
> Razorpay payments, authentication, and WebSocket/human-support features are
> **not** implemented yet — they will be built in later steps on top of this
> foundation.

## Tech Stack

- **FastAPI** — web framework
- **SQLAlchemy 2.x** — ORM (using the modern `Mapped` / `mapped_column` style)
- **PostgreSQL** — database
- **Alembic** — migrations
- **Pydantic v2** — request/response validation
- **Uvicorn** — ASGI server

## Project Structure

```
backend/
├── alembic/
│   ├── env.py                 # wired to app.core.config.settings.DATABASE_URL
│   └── versions/
│       └── 0001_initial.py    # creates merchants, products, orders, order_items, audit_logs
├── alembic.ini
├── app/
│   ├── api/
│   │   ├── deps.py            # shared dependencies (get_db, pagination params)
│   │   └── routes/            # one router module per resource
│   ├── agents/                 # placeholder for the AI shopping agent (future step)
│   ├── core/
│   │   └── config.py           # Settings (reads .env)
│   ├── db/
│   │   ├── base.py             # engine, SessionLocal, Base, get_db
│   │   └── seed_data.py        # idempotent demo data
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                 # Pydantic schemas
│   ├── services/                # business logic used by routes
│   ├── utils/
│   └── main.py                  # FastAPI app, CORS, routers, error handlers
├── seed.py                      # entrypoint: `python seed.py`
├── requirements.txt
├── .env.example
└── .env                         # NOT committed (see .gitignore at repo root)
```

## Prerequisites

- Python 3.11+
- PostgreSQL 13+ running locally (or reachable via `DATABASE_URL`)
- `pip`

## 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Set up PostgreSQL

Create the database (adjust user/password as needed for your local Postgres setup):

```bash
# using the createdb helper
createdb ai_commerce

# or via psql
psql -U postgres -c "CREATE DATABASE ai_commerce;"
```

If you don't have Postgres installed locally, the quickest option is Docker:

```bash
docker run --name ai-commerce-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ai_commerce \
  -p 5432:5432 -d postgres:16
```

## 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your Postgres credentials, e.g.:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ai_commerce
```

`.env` is already listed in the repo root `.gitignore` — it will never be committed.

## 5. Run Alembic migrations

This creates all tables (`merchants`, `products`, `orders`, `order_items`, `audit_logs`):

```bash
alembic upgrade head
```

To verify the migration applied:

```bash
alembic current
# should print: 0001_initial (head)
```

## 6. Seed demo data

Populates 2 merchants, 13 realistic products, 6 orders (across different order/payment
statuses), and their corresponding audit-log events. Safe to re-run — it's idempotent
and won't create duplicates.

```bash
python seed.py
```

Expected output:

```
Seed complete:
  merchants:  2
  products:   13
  orders:     6
  audit_logs: <n>
```

## 7. Start the FastAPI server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or:

```bash
python -m app.main
```

The API is now available at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

All resource endpoints are namespaced under `/api`.

| Method | Path                             | Description                              |
|--------|-----------------------------------|-------------------------------------------|
| GET    | `/api/health`                     | Health check + DB connectivity status     |
| GET    | `/api/products`                   | List products (filters + pagination)      |
| GET    | `/api/products/{id}`              | Get a single product                      |
| POST   | `/api/products`                   | Create a product                          |
| PUT    | `/api/products/{id}`              | Update a product                          |
| GET    | `/api/merchants/{id}`             | Get a merchant                            |
| GET    | `/api/merchants/{id}/orders`      | List a merchant's orders (paginated)      |
| GET    | `/api/orders/{id}`                | Get an order with its line items          |
| GET    | `/api/audit-logs`                 | List audit log entries (filters + paging) |

`GET /api/products` query params: `skip`, `limit`, `category`, `merchant_id`,
`is_active`, `search`.

`GET /api/audit-logs` query params: `skip`, `limit`, `actor`, `action`,
`entity_type`, `entity_id`.

### Quick manual test with curl

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/products
curl http://localhost:8000/api/products/1
curl http://localhost:8000/api/merchants/1
curl http://localhost:8000/api/merchants/1/orders
curl http://localhost:8000/api/orders/1
curl http://localhost:8000/api/audit-logs
```

## CORS

`app/core/config.py` allows `http://localhost:3000`, `http://localhost:5173`,
`http://127.0.0.1:3000`, and `http://127.0.0.1:5173` by default (covering both CRA-
and Vite-style local dev servers) so the existing React frontend can call this API
without any extra configuration.

## Security notes

- Database credentials are only ever read from environment variables /
  `.env` — nothing is hardcoded in source.
- `.env` is git-ignored at the repo root; only `.env.example` (no real secrets) is committed.
- Unhandled exceptions return a generic `{"detail": "Internal server error"}` (500)
  instead of leaking stack traces or internals.
- All request bodies are validated with Pydantic (e.g. `price` must be > 0, `stock` >= 0).

## Adding new models / routes (for future steps)

1. Add the SQLAlchemy model in `app/models/`, and import it in `app/models/__init__.py`.
2. Generate a migration:
   ```bash
   alembic revision --autogenerate -m "add X"
   alembic upgrade head
   ```
3. Add Pydantic schemas in `app/schemas/`.
4. Add business logic in `app/services/`.
5. Add the route in `app/api/routes/`, then register it in `app/api/routes/__init__.py`.

## Common issues

**`psycopg2.OperationalError: could not connect to server`**
Postgres isn't running, or `DATABASE_URL` in `.env` doesn't match your setup. Verify
with `psql $DATABASE_URL -c '\dt'` (or `psql -U user -h localhost -d ai_commerce`).

**`sqlalchemy.exc.ProgrammingError: relation "products" does not exist`**
Migrations haven't been applied yet — run `alembic upgrade head`.

**`ModuleNotFoundError: No module named 'app'`**
Run commands from the `backend/` directory (not the repo root), with the virtual
environment activated.

**`ImportError` related to `email-validator`**
Re-run `pip install -r requirements.txt` — `email-validator` is required by Pydantic's
`EmailStr` (used in the merchant schema).

## What's intentionally NOT implemented yet

- AI / LLM shopping agent (`app/agents/` is a placeholder)
- Razorpay payment integration
- Authentication / authorization
- WebSockets / human support chat, voice, video

These are planned for subsequent steps, building on top of this foundation
(in particular, the `AuditLog` model and `/api/audit-logs` endpoint already support
the event types the future AI workflow will write: `customer_request_received`,
`product_search_performed`, `product_recommended`, `upsell_suggested`,
`customer_approval_received`, `order_created`, `payment_initiated`,
`payment_successful`).
