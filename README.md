# BeCon

Mobile app to buy SIM, eSIM, and recharge plans for the Saudi Arabian market.

BeCon handles **order intake, payment, handoff, and status tracking**. The actual
recharge/SIM fulfillment is performed in a separate existing system (ops marks orders
complete from the admin website for now).

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design.

## Monorepo layout

```
becon/
├─ supabase/        # Database schema, migrations, seed, edge functions
├─ apps/
│  ├─ admin/        # Next.js admin website (ops team)
│  └─ mobile/       # React Native (Expo) user app
├─ packages/
│  └─ shared/       # Shared TypeScript types & constants
└─ ARCHITECTURE.md  # Technical architecture document
```

## Core stack

| Layer | Tool |
|---|---|
| Backend (DB + Auth + Storage + Edge Functions) | Supabase (PostgreSQL) |
| Payments | Moyasar (mada, Apple Pay, STC Pay) |
| Admin website | Next.js |
| Mobile app | React Native (Expo) |
| Push | FCM + APNs |

## Getting started

Each app has its own README. Start with the database:

```powershell
# 1. Install the Supabase CLI (once)
npm install -g supabase

# 2. Start a local Supabase stack (requires Docker)
cd supabase
supabase start

# 3. Apply migrations + seed
supabase db reset
```

Then run the admin site (`apps/admin`) and the mobile app (`apps/mobile`).
```
