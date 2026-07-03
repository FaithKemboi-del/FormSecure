# FormSecure

Mobile-first escrow ticket marketplace UI — dark glass aesthetic with emerald trust accents and violet primary actions.

## Features

- **Home browse** — phase filter chips, search, predictive gate-price pills, seller tags
- **Event detail** — phase tabs, fixed-price seller cards, escrow checkout flow
- **Wishlist** — heart toggle on every card (optimistic UI + stub `POST/DELETE /api/wishlist/{eventId}`)
- **Saved tab** — filterable saved events in bottom nav
- **Responsive** — 1 col mobile → 2 col tablet → 3 col desktop (`sm` / `md` / `lg` / `xl`)

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Fonts: Space Grotesk, Inter, JetBrains Mono

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `bg` | `#05060a` | Page background |
| `panel-glass` | `rgba(17,23,41,0.62)` | Cards |
| `emerald` | `#16f2b2` | Trust / saved / escrow |
| `violet` | `#9b7bff` | Primary CTA |
