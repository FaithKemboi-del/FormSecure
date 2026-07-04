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
│   ├── routers/       # API routes (auth, etc.)
│   ├── schemas/       # Pydantic request/response models
│   ├── services/      # OTP, JWT, SMS stub
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

## Authentication (phone OTP + JWT)

Kenyan phone numbers (`+254` format) authenticate via SMS OTP — no passwords.

| Endpoint | Description |
|---|---|
| `POST /api/auth/request-otp` | Send 6-digit OTP (logged to console in dev) |
| `POST /api/auth/verify-otp` | Verify OTP, create/login user, return tokens |
| `POST /api/auth/refresh` | Rotate refresh token, issue new access token |
| `GET /api/me` | Protected profile (Bearer access token) |

### Dev flow

```bash
# 1. Request OTP
curl -X POST http://127.0.0.1:8000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "0712345678"}'
# Check server console for: [SMS STUB] OTP for +254712345678: 123456

# 2. Verify OTP (new users must include full_name)
curl -X POST http://127.0.0.1:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "0712345678", "otp": "123456", "full_name": "Faith K."}'

# 3. Get profile
curl http://127.0.0.1:8000/api/me \
  -H "Authorization: Bearer <access_token>"
```

- OTP expires in **5 minutes**, single-use
- Access token: **15 minutes**
- Refresh token: **30 days** (rotated on refresh)

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
| `JWT_SECRET_KEY` | (required in prod) | Signs access/refresh JWTs |
| `OTP_HMAC_SECRET` | (required in prod) | HMAC key for OTP hashing |
