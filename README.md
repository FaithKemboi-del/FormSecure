# FormSecure

P2P ticket escrow marketplace — React frontend + FastAPI backend.

## Frontend

Mobile-first escrow ticket marketplace UI — dark glass aesthetic with emerald trust accents and violet primary actions.

### Features

- **Home browse** — phase filter chips, search, predictive gate-price pills, seller tags
- **Event detail** — phase tabs, fixed-price seller cards, escrow checkout flow
- **Wishlist** — heart toggle on every card (optimistic UI + stub `POST/DELETE /api/wishlist/{eventId}`)
- **Saved tab** — filterable saved events in bottom nav
- **Responsive** — 1 col mobile → 2 col tablet → 3 col desktop (`sm` / `md` / `lg` / `xl`)

### Frontend stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4

### Frontend development

```bash
npm install
npm run dev
```

## Backend

See [`backend/README.md`](backend/README.md) for full setup.

```bash
cd backend
docker compose up -d          # PostgreSQL
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`

### Backend stack

- FastAPI + async SQLAlchemy + PostgreSQL
- Alembic migrations
- Models: User, Event, TicketPhase, Listing, EscrowTransaction, WishlistItem, WaitlistEntry

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `bg` | `#05060a` | Page background |
| `panel-glass` | `rgba(17,23,41,0.62)` | Cards |
| `emerald` | `#16f2b2` | Trust / saved / escrow |
| `violet` | `#9b7bff` | Primary CTA |
