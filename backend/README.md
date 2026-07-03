# FormSecure Backend

FastAPI + async SQLAlchemy + PostgreSQL backend for the P2P ticket escrow marketplace.

## Stack

- Python 3.12+
- FastAPI
- SQLAlchemy 2 (async) + asyncpg
- Alembic migrations
- PostgreSQL 16

## Project layout

```
backend/
├── app/
│   ├── core/          # config, async DB engine/session
│   ├── models/        # SQLAlchemy models
│   ├── routers/       # API routes (empty for now)
│   ├── schemas/       # Pydantic schemas (empty for now)
│   ├── services/      # business logic (empty for now)
│   └── main.py        # FastAPI app + /health
├── alembic/           # migrations
├── docker-compose.yml # local PostgreSQL
└── requirements.txt
```

## Models

| Model | Purpose |
|---|---|
| `User` | Buyers and sellers (same user type) |
| `Event` | Marketplace events |
| `TicketPhase` | Phase tiers per event (Early Bird, VIP, etc.) with face value |
| `Listing` | Seller ticket for sale linked to a phase |
| `EscrowTransaction` | Escrow lifecycle: pending → escrowed → verified → released, or expired → refunded |
| `WishlistItem` | Saved events per user |
| `WaitlistEntry` | Sold-out phase alerts with max budget + contact number |

## Local setup

### 1. Start PostgreSQL

With Docker:

```bash
cd backend
docker compose up -d
```

Or use a local PostgreSQL instance and create a database/user matching `.env.example`.

### 2. Install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Run migrations

```bash
alembic upgrade head
```

### 4. Start the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok","service":"FormSecure API"}
```

API docs: http://127.0.0.1:8000/docs

## Escrow transaction statuses

- `pending` — buyer initiated, payment not yet confirmed
- `escrowed` — buyer paid; funds held; `transfer_code` generated; `expires_at` = paid_at + 30 min
- `verified` — buyer entered matching transfer code
- `released` — seller paid (minus commission)
- `expired` — 30-minute window passed without verification
- `refunded` — buyer funds returned after expiry

## Environment

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://formsecure:formsecure@localhost:5432/formsecure` | Async SQLAlchemy URL |
| `DEBUG` | `false` | SQL echo logging |
