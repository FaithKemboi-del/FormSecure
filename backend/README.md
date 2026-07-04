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
│   ├── routers/       # API routes (auth, events, listings, admin)
│   ├── schemas/       # Pydantic request/response models
│   ├── services/      # OTP, JWT, events, listings, scraper jobs
│   └── main.py        # FastAPI app + /health
├── alembic/           # migrations
├── docker-compose.yml # local PostgreSQL
└── requirements.txt
```

## Models

| Model | Purpose |
|---|---|
| `User` | Buyers and sellers (same user type); `is_admin` for admin routes |
| `Event` | Marketplace events (`source_site` + `external_event_id` for scraper dedup) |
| `TicketPhase` | Phase tiers per event (Early Bird, VIP, etc.) with face value and optional `estimated_gate_value` |
| `Listing` | Seller ticket for sale linked to a phase |
| `EscrowTransaction` | Escrow lifecycle: pending → escrowed → verified → released, or expired → refunded |
| `WishlistItem` | Saved events per user |
| `WaitlistEntry` | Sold-out phase alerts with max budget + contact number |
| `ScraperSource` | Ticketing sites tracked for legal scraping permission |

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

## Events & listings

Browse events and manage seller listings. Listings are fixed-price only (no auctions), capped at face value + 20%.

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/events` | Public | List events with filters: `location`, `date_from`, `date_to`, `phase_slug`, `phase_available`, `min_price`, `max_price` |
| `GET /api/events/{id}` | Public | Event detail with active listings grouped by phase; each listing shows seller name/rating, price, and savings vs. gate price |
| `POST /api/listings` | Bearer | Create listing: `event_id`, `phase_id`, `asking_price`, `external_ticket_identifier` (phone/email on external platform). Rejects if price > face value × 1.2 |
| `GET /api/listings/mine` | Bearer | Seller's active and past listings |
| `DELETE /api/listings/{id}` | Bearer | Cancel own listing (blocked if an in-progress escrow transaction exists) |

Gate price defaults to `estimated_gate_value` on the phase, or face value × 1.35 when unset.

### Create a listing

```bash
curl -X POST http://127.0.0.1:8000/api/listings \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "<uuid>",
    "phase_id": "<uuid>",
    "asking_price": "3500.00",
    "external_ticket_identifier": "faith@email.com"
  }'
```

## Scraper permission tracking & ingestion

On startup the API seeds six Kenyan ticketing sources (all `is_currently_approved=false` until checked), runs an immediate robots.txt + Terms of Service permission check, then schedules:

- **Monthly** (1st of month, 02:00 UTC) — re-check robots.txt and ToS for every `ScraperSource`
- **Nightly** (03:00 UTC) — scrape approved sources only; parser stubs return empty until sites are approved and implemented

Approval requires `robots_txt_status=allowed` **and** `tos_status≠prohibits_scraping`. If a site flips from approved to blocked, the server logs:

`ALERT: scraping permission revoked for {site_name}, disabling scraper`

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/admin/scraper-sources` | Admin Bearer | Current approval status for all scraper sources |

Set a user as admin in the database:

```sql
UPDATE users SET is_admin = true WHERE phone_number = '+254712345678';
```

Per-site HTML parsers live in `app/services/scraper/parsers.py` as stubs ready to fill in once a source is approved.

## Escrow transaction statuses

- `pending` — buyer initiated, payment not yet confirmed
- `escrowed` — buyer paid; funds held; `transfer_code` generated; `expires_at` = paid_at + 30 min
- `verified` — buyer entered matching transfer code
- `released` — seller paid (minus commission)
- `expired` — 30-minute window passed without verification
- `refunded` — buyer funds returned after expiry

## M-Pesa / Safaricom Daraja

| Mode | Cost | Use when |
|---|---|---|
| `MPESA_MODE=stub` | **Free** | Local dev — simulates STK in the terminal |
| `MPESA_MODE=daraja` + sandbox | **Free** | Testing real STK prompts with Safaricom test credentials |
| `MPESA_MODE=daraja` + production | **M-Pesa txn fees only** | Live payments (no separate Daraja subscription) |

### What I can code vs what you must do

The app includes Daraja STK Push + callback handling. **You** must create a Safaricom developer account and paste credentials into `.env` — nobody else can do that step for you.

### Sandbox setup (free)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → copy **Consumer Key** and **Consumer Secret**
3. Under Lipa na M-Pesa Online → copy **Passkey**; sandbox shortcode is usually `174379`
4. Expose your local API with **ngrok**: `ngrok http 8000`
5. Set in `backend/.env`:

```env
MPESA_MODE=daraja
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://YOUR-NGROK-ID.ngrok.io/api/mpesa/stk-callback
```

6. Use Safaricom sandbox test phone `254708374149` and PIN `174379` (see their docs)

### Production (real money)

- Register a business PayBill or Till with Safaricom
- Complete **Go Live** on the developer portal
- Switch `MPESA_ENVIRONMENT=production` and use your live shortcode/passkey
- Standard **M-Pesa transaction fees** apply per payment (buyer/seller pays via normal M-Pesa rules) — there is no monthly “Daraja API fee”

Callback URL: `POST /api/mpesa/stk-callback` — Safaricom calls this when the buyer enters their PIN.

## Environment

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://formsecure:formsecure@localhost:5432/formsecure` | Async SQLAlchemy URL |
| `DEBUG` | `false` | SQL echo logging |
| `JWT_SECRET_KEY` | (required in prod) | Signs access/refresh JWTs |
| `OTP_HMAC_SECRET` | (required in prod) | HMAC key for OTP hashing |

### Supabase pooler note

If using Supabase **transaction pooler** (port `6543`), the app disables asyncpg prepared statement caching automatically. This avoids `DuplicatePreparedStatementError` from PgBouncer.
