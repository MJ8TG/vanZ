# VanZ Mobile — Stitch Design ↔ App Screen Audit

Audit of `stitch_vanz_mobile_design_system` screens against the Expo app (`mobile/`),
checking three things per screen: **route exists**, **backend wired** (real Supabase
tables/columns + APIs, no mocks), and **design alignment**.

Legend: ✅ done · ⚠️ partial/issue · ❌ missing · — N/A

Schema reference: tables verified against `supabase/schema.sql`.
Typecheck: `mobile` passes `tsc --noEmit` (exit 0).

---

## A. Client flow

| Stitch design | App route | Route | Backend | Notes |
|---|---|---|---|---|
| vanz_bienvenue | `welcome.tsx` | ✅ | ✅ | Carousel + register/login nav. |
| (mode select) | `mode-selector.tsx` | ✅ | ✅ | Writes `users.role`. |
| login / inscription | `auth/login.tsx`, `auth/register.tsx` | ✅ | ✅ | **Email+password auth, not the Stitch phone+OTP design.** Register passes `full_name`+`phone` to auth metadata (relies on DB trigger to create `users` row). |
| vanz_mobile_accueil_1/2 | `(client)/index.tsx` | ✅ | ✅ | Map + Google Places + `BookingSheet`. Design is map-first (Bolt-style) vs Stitch service-grid — intentional. |
| vanz_publier_un_job + vanz_rechercher_une_adresse | `BookingSheet.tsx` + autocomplete modal | ✅ | ✅ | Inserts into `jobs` (status `open`). `service_type` hardcoded `'parcel'`. |
| vanz_mes_jobs / vanz_historique_des_jobs | `(client)/missions.tsx` | ✅ | ✅ | `useMissions` + realtime sync, active/history tabs. |
| vanz_offres_re_ues | `(client)/job/[id].tsx` | ✅ | ✅ | `useJobDetails`, "Meilleur Prix" badge, accept via `/api/jobs/accept`, live driver tracking via realtime broadcast. |
| vanz_paiement_s_curis | (Paymee web redirect) | ⚠️ | ✅ | No native payment screen; `Linking.openURL(payment_url)` to Paymee. Acceptable but not the Stitch in-app card UI. |
| vanz_suivi_de_livraison / vanz_suivi_en_temps_r_el | inline map in `job/[id].tsx` | ⚠️ | ✅ | Driver marker tracked via realtime, but **no dedicated full-screen tracking with bottom sheet / SOS / ETA** as designed. |
| vanz_profil_client | `(client)/profile.tsx` | ⚠️ | ⚠️ | Minimal: settings/lang/switch-mode/logout. **"Account settings" button is dead (no onPress). Does not read `users` (no credit_balance/loyalty). No links to wallet/addresses/referral/notifications/help.** |
| vanz_portefeuille (client credits) | — | ❌ | — | No client wallet screen (`credit_balance`, `loyalty_points`). |
| vanz_mes_adresses | — | ❌ | — | `saved_addresses` table exists, no screen. |
| vanz_parrainage | — | ❌ | — | `referrals` table exists, no screen. |
| vanz_notifications | — | ❌ | — | `notifications` table exists, no screen/bell. |
| vanz_laisser_un_avis | — | ❌ | — | `reviews` table exists, no post-job review screen. |
| vanz_d_tails_transaction | — | ❌ | — | No transaction detail screen. |
| vanz_centre_d_aide | — | ❌ | — | No help center. |
| vanz_param_tres_de_l_application | — | ❌ | — | No settings screen (profile button is dead). |
| vanz_confirmation_de_succ_s | inline (register success) | ⚠️ | — | Reused ad-hoc; no shared success screen/component. |
| chat | `(client)/messages.tsx`, `(client)/chat/[id].tsx` | ✅ | ✅ | `ConversationsListView` + `ChatThread` via `chatService` (realtime messages + phase, `users_public` view). |

## B. Driver flow

| Stitch design | App route | Route | Backend | Notes |
|---|---|---|---|---|
| vanz_chauffeur_tableau_de_bord_1/2 | `(driver)/index.tsx` | ✅ | ✅ | Verification gate (`drivers.status==='approved'`), map marketplace, `DriverJobSheet`. **Online toggle is local-only — does not persist `users.is_online` or start GPS broadcast.** |
| vanz_chauffeur_missions_1/2 | `(driver)/index.tsx` + `(driver)/trips.tsx` | ✅ | ✅ | Marketplace feed + `useTrips`; status updates via `/api/jobs/update-status`, completion via `/api/jobs/complete` (uploads to `delivery-proofs`). |
| vanz_chauffeur_d_tails_mission | `(driver)/bid/[id].tsx` + `DriverJobSheet` | ✅ | ✅ | Reads job/bids/drivers, bid via `/api/bids/create`. |
| vanz_chauffeur_messagerie / vanz_messagerie_chauffeur | `(driver)/messages.tsx`, `(driver)/chat/[id].tsx` | ✅ | ✅ | Shared chat components. |
| vanz_chauffeur_profil_1/2 | `(driver)/profile.tsx` | ✅ | ✅ | Reads `drivers`, signOut. |
| vanz_portefeuille (driver) | `(driver)/wallet.tsx` | ✅ | ✅ | Reads `credit_balance`/`pending_commission_debt`, `wallet_transactions`, pending `withdrawals`; withdrawal request flow. |
| vanz_chauffeur_v_rification | `(driver)/verify.tsx` | ⚠️ | ❌ | **CRITICAL: `handleSubmit` is a mock (`setTimeout 1500`). Picks images but never uploads to Storage nor updates `drivers` (docs/status). Driver onboarding does not persist.** |
| vanz_chauffeur_d_tails_des_gains | — | ❌ | — | No per-job earnings detail (wallet shows aggregate only). |
| vanz_chauffeur_mon_v_hicule | — | ❌ | — | No vehicle screen. |
| vanz_chauffeur_ajouter_un_v_hicule | — | ❌ | — | No add-vehicle screen. |
| vanz_chauffeur_mes_documents | — | ❌ | — | No document management (verify is onboarding-only). |
| vanz_chauffeur_param_tres | — | ❌ | — | No driver settings screen. |

## C. Admin (web — out of mobile scope)

`vanz_admin_dashboard`, `vanz_admin_finances_revenus`, `vanz_admin_gestion_des_chauffeurs`,
`vanz_admin_tableau_de_bord_fleet` → correspond to Next.js `app/[locale]/admin/*` (already present:
`drivers`, `disputes`, `jobs`, `users`, `notifications`, `promos`, `withdrawals`, `system`). Not part of the Expo app.

## D. Design exploration (ignore)

`vanz_variant_minimaliste_pur`, `vanz_variant_premium_immersif`, `vanz_variant_sombre_audacieux`, `three.js` — style studies, not screens.

---

## Findings summary

### Critical (backend broken)
1. ~~**`(driver)/verify.tsx`** — document submit is mocked; nothing is uploaded or persisted.~~ **✅ FIXED** — rewritten as a 3-step wizard (Identity → Vehicle → Documents) that uploads photos to `driver-documents` and POSTs all fields to `/api/drivers/signup` (same validated endpoint as web; upserts `users` + `drivers`, status `pending`). `(driver)/index.tsx` now shows a dedicated **"En cours de vérification"** state for `pending` and a **"Demande refusée"** + resubmit state for `rejected`, instead of looping on the onboarding CTA.

### Medium (works but incomplete vs design/schema)
2. ~~**Driver online toggle** — local state only.~~ **✅ FIXED** — `(driver)/index.tsx` now persists `users.is_online`/`last_online_at` via `DriverService.updateOnlineStatus` and starts/stops `useLocationBroadcaster` while online (+ unmount safeguard sets offline). Also fixed a **realtime channel-name mismatch** (driver broadcast `tracking:` vs client listen `client-tracking-`) by centralizing the name in `lib/realtime.ts` — live tracking now actually reaches the client.
3. **Client profile** (`(client)/profile.tsx`) — dead "Account settings" button; doesn't read `users`; (Notifications entry point now added). Still missing wallet/addresses/referral/help links.
4. **No dedicated live-tracking screen** — tracking is an inline map in job detail; Stitch designed a full tracking screen (bottom sheet, ETA, SOS).
5. **Auth is email/password**, not the Stitch phone+OTP flow.

### Missing screens (table exists, no UI)
- ~~Notifications~~ **✅ BUILT** — shared `components/notifications/NotificationsView.tsx` + `(client)/notifications.tsx` & `(driver)/notifications.tsx` (realtime INSERT stream, mark-all/single read, typed icons, time-ago, bilingual), reachable from both profiles. Added `016_notifications_rls.sql` (own-row SELECT/UPDATE + realtime publication) — **must be run in the Supabase SQL Editor** (this repo applies loose numbered SQL files manually, in order — there is no `supabase/migrations/`, so `supabase db push` does nothing). See `supabase/README_SQL.md`.
- ~~Post-job review~~ **✅ BUILT** — `(client)/review/[jobId].tsx` (5-star, conditional tags matching web ids, comment), inserts into `reviews` (reviewer_type `client`); guards completed-only / not-already-reviewed; CTA added on completed jobs in `job/[id].tsx`. Uses existing `reviews` RLS (public read + own insert) — no migration needed.
- ~~Saved addresses~~ **✅ BUILT** — `(client)/addresses.tsx` (list, add via sheet with label presets, set-default, delete) on `saved_addresses`. Reachable from client profile.
- ~~Referral~~ **✅ BUILT** — shared `components/referral/ReferralView.tsx` + `(client)/referral.tsx` & `(driver)/referral.tsx`: shows `users.referral_code`, native Share + WhatsApp link, stats (invited / rewarded / DT earned) from `referrals`. Reachable from both profiles.
- Added migration `017_addresses_referrals_rls.sql` (own-row RLS for both tables).
- ~~Client wallet/credits~~ **✅ BUILT** — `(client)/wallet.tsx`: `credit_balance`, `loyalty_points`, `wallet_transactions` history (typed by schema `credit/debit/promo/referral/refund`). Reachable from client profile.
- ~~Driver my vehicle / my documents~~ **✅ BUILT** — `(driver)/vehicle.tsx`: reads `drivers` row, shows vehicle + identity + document checklist + status badge, with update-docs link to `verify`. Fills the previously-dead "Mon Véhicule" button.
- Added migration `018_wallet_loyalty_rls.sql` (own-row read for `wallet_transactions`/`loyalty_transactions` — also unblocks the existing **driver wallet**, which had the same missing-policy issue).
- ~~Help center~~ **✅ BUILT** — shared `components/help/HelpView.tsx` + client/driver routes: FAQ accordion + WhatsApp contact (`EXPO_PUBLIC_SUPPORT_PHONE`).
- ~~App settings~~ **✅ BUILT** — shared `components/settings/SettingsView.tsx` + client/driver routes: account info, language, legal links (open web `/<locale>/...`), help link, logout. Wires the previously-dead "Account settings" buttons on both profiles.
- ~~Driver earnings detail~~ **✅ BUILT** — `(driver)/earnings.tsx`: total payout + commission, per-mission breakdown from completed trips (`driver_payout`/`commission_amount`/`accepted_bid_amount`). Reachable via "Mes gains" in the driver profile.
- Remaining: client transaction-detail (minor — wallet list already shows note/amount/date inline).

### Deploy steps (pending)
- Apply `016`/`017`/`018` to the database by running each file **in the Supabase SQL Editor**, in order (without them, Notifications / Mes adresses / Parrainage / Portefeuille read empty). This repo applies loose numbered SQL files manually — there is no `supabase/migrations/`, so `supabase db push` does nothing. See `supabase/README_SQL.md`.

---

## Recommended execution order
1. **Fix `verify.tsx`** — upload images to `driver-documents` bucket, update `drivers` row (doc paths + `status='pending'`). *(critical)*
2. Persist driver **online status** + wire GPS broadcaster.
3. Flesh out **client profile** (real `users` data + nav to sub-screens).
4. Build missing high-value screens: **notifications**, **review**, **saved addresses**, **referral**, client **wallet**.
5. Optional: dedicated tracking screen, vehicle/document management, settings, help.
