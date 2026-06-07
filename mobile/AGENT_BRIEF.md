# VanZ Mobile Agent Brief

This mobile app uses Expo SDK 56 and Expo Router. Read `mobile/AGENTS.md` before coding.

## Coordination Rules

- Keep each agent on one isolated slice. Do not let two agents edit the same files at the same time.
- The web app and Supabase schema are the source of truth for business fields.
- Run these from `mobile/` before handing work back:
  - `npx tsc --noEmit --pretty false`
  - `npm run lint -- --quiet`
- Do not add new dependencies unless the integrator approves them.
- Prefer small, complete flows over broad partial rewrites.

## Current Mobile MVP Slices

### Agent A: Client Booking
Owns:
- `src/app/(client)/index.tsx`
- `src/components/booking/BookingSheet.tsx`

Goal:
- Make job creation match the Supabase `jobs` table: `client_id`, `service_type`, pickup/dropoff fields, `load_capacity`, `scheduled_at`, `time_slot`, `description`, `status`.
- Do not write non-schema columns like `user_id`, `vehicle_size`, or `budget`.

### Agent B: Driver Marketplace
Owns:
- `src/app/(driver)/index.tsx`
- `src/components/booking/DriverJobSheet.tsx`
- `src/app/(driver)/trips.tsx`

Goal:
- Let approved drivers browse `open` jobs, submit bids, and view active accepted trips.
- Prices should come from `bids.amount`, `accepted_bid_amount`, or `driver_payout`, not `jobs.budget`.

### Agent C: Account Shell
Owns:
- `src/app/welcome.tsx`
- `src/app/auth/*`
- `src/app/mode-selector.tsx`
- `src/app/_layout.tsx`
- `src/store/useAuthStore.ts`

Goal:
- Keep auth/routing reliable, polished, and bilingual-ready.

## Integrator Role

Codex keeps the green baseline, resolves merge conflicts, and verifies root web plus mobile checks.
