# VanZ — Master Task Plan

## 🎯 Project Summary
**VanZ** is a two-sided transport marketplace for Tunisia, inspired by AnyVan.com (UK) and Bolt's UX. Clients post transport jobs (furniture, parcels, house moves), verified drivers bid competitively, and the platform takes 10–15% commission.

**Key Context:**
- **Logo**: Sky blue background, white van icon with yellow lightning bolt "Z"
- **Languages**: French (primary), Arabic RTL (secondary) — no English on the site
- **Currency**: TND (Tunisian Dinar) — never $ or €
- **Cities**: Tunis, Sousse, Sfax, Monastir, Bizerte, Nabeul, Ariana, Ben Arous, La Marsa, Manouba, Gabès
- **Brand Colors**: Teal `#2BBFDF`, Yellow `#F5C800`, Navy `#0B1021`, Ice Blue `#F0F6FA`, Green `#22C55E`
- **Inspiration**: AnyVan.com structure + Bolt's mobile UX

---

## Phase 1 — Website (Next.js) [CRITICAL — Launch First]

### [x] 1.1 Project Setup ✅
- [x] Initialize Next.js 14 with App Router
- [x] Configure Tailwind CSS v3 with custom VanZ colors (teal, yellow, navy, ice)
- [x] Install and configure: Framer Motion, Swiper.js, Lucide React icons
- [x] Setup Google Fonts: Cairo (700, 900) + Plus Jakarta Sans (400, 600)
- [x] Setup `next-intl` for FR/AR bilingual (default: `fr`)
- [x] Create `middleware.ts` for locale detection
- [x] Create `/messages/fr.json` and `/messages/ar.json`
- [x] Setup `tailwind.config.ts` with `vanz-teal`, `vanz-yellow`, `vanz-navy`, `vanz-ice`
- [x] Create file structure: `app/[locale]/`, `components/`, `public/`, `messages/`
- [x] Place logo files in `/public/logo-vanz.png` and `/public/logo-vanz-white.png`

### [x] 1.2 Homepage — 10 Sections ✅
- [x] **Navbar** — Teal `#2BBFDF` bg, sticky, logo + "Nos services" dropdown + "Se connecter" + "Publier un job" CTA (yellow) + "Devenir chauffeur" + FR/AR language toggle
- [x] **Section 1 — Hero** — Navy `#0B1021` bg, left 60% (H1 + subtitle + 2 CTA buttons + trust badges), right 40% (3D placeholder/fallback), 4 service thumbnail cards below
- [x] **Section 2 — Stats Bar** — Teal strip, 4 animated count-up stats (+500 jobs, +80 drivers, 4.8★ rating, 30% savings)
- [x] **Section 3 — How It Works** — White bg, 3-step cards (Publiez → Recevez → C'est parti), stagger animation on scroll
- [x] **Section 4 — Services Grid** — Ice Blue bg, 2×3 grid (Déménagement, Transport meublé, Livraison colis, Inter-villes, Bureaux, Express)
- [x] **Section 5 — Why VanZ** — White bg, 2-column (60% features + 40% phone mockup), 4 feature points
- [x] **Section 6 — Live Jobs Feed** — Ice Blue bg, Swiper carousel, 3 visible desktop, hardcoded sample data (5 jobs)
- [x] **Section 7 — Reviews** — Navy bg, Swiper carousel with white review cards, 5 hardcoded reviews
- [x] **Section 8 — Cities Grid** — White bg, clickable city chips linking to SEO pages
- [x] **Section 9 — CTA Band** — Yellow `#F5C800` bg, "Un van pour ça. Maintenant." + 2 buttons
- [x] **Section 10 — Footer** — Navy bg, 4 columns (Brand/Services/Villes/Entreprise), social links, WhatsApp, copyright

### [x] 1.3 SEO Pages (Phase 1 — Week 1 Launch) ✅
- [x] `/transport-meuble-tunis` — H1: "Transport meuble à Tunis — rapide et pas cher"
- [x] `/transport-meuble-sfax`
- [x] `/transport-meuble-sousse`
- [x] `/blog/prix-demenagement-tunisie` — Full article ready (800+ words)
- [x] `/blog/transport-meuble-prix-tunis` — Full article ready
- [x] `/blog/comment-demenager-tunisie` — Full article ready
- [x] Each SEO page: unique H1, meta title (60 chars), meta desc (150-160 chars), JSON-LD (LocalBusiness + FAQPage), FAQ section, internal links, canonical URL

### [x] 1.4 SEO Pages (Phase 2 — Weeks 2-3) ✅
- [x] `/transport-canape-tunis`
- [x] `/transport-frigo-tunis`
- [x] `/transport-machine-laver`
- [x] `/livraison-tunis-sfax`
- [x] `/livraison-tunis-sousse`
- [x] `/demenagement-tunis`
- [x] `/demenagement-pas-cher`
- [x] `/transport-meuble-ariana`
- [x] `/transport-meuble-monastir`
- [x] `/prix-transport-meuble-tunis`

### [x] 1.5 SEO Infrastructure ✅
- [x] Homepage metadata (title, description, OG, hreflang)
- [x] JSON-LD schema on homepage (`LocalBusiness`)
- [x] `next-sitemap` for auto sitemap generation
- [x] Blog index page at `/blog`
- [x] Lighthouse score target: 90+ on mobile
- [x] All images: `next/image` with `webp` format
- [x] Font preloading for Cairo + Plus Jakarta Sans

### [x] 1.6 3D Hero Scene (Optional Enhancement — After SEO Ranking) ✅
- [x] `HeroScene.tsx` — Three.js dynamic import, `ssr: false`
- [x] Tunisia map outline (white wireframe) on navy bg
- [x] Animated low-poly van on route path with yellow particle trail
- [x] Teal glowing dots at city positions
- [x] `StaticHeroFallback` component while Three.js loads
- [x] Canvas: `position: absolute`, `pointer-events: none`, `z-index: 0`
- [x] Hidden on mobile (`hidden md:block`)

### [x] 1.7 Driver Signup Form — `/devenir-chauffeur` ✅
- [x] 5-step wizard form with progress bar
- [x] **Step 1 — Compte**: Phone (+216 prefix) + OTP 6-digit
- [x] **Step 2 — Identité + CIN**: prénom, nom, email (opt), city (select), CIN number (8 digits), DOB (age ≥ 18), CIN expiry (future date), CIN front/back photo uploads (JPG/PNG, max 5MB)
- [x] **Step 3 — Véhicule**: type (radio: Camionnette/Camion léger/Utilitaire/Berline), brand (select), model, year, color (opt), plate number (Tunisian format: 123 TN 4567), load capacity
- [x] **Step 4 — Documents**: carte grise (req), assurance (req), permis (req), visite technique (opt), vehicle photo (opt) — all uploaded to Supabase Storage `driver-documents/{id}/`
- [x] **Step 5 — Confirmation**: Summary, "En cours de vérification" badge, WhatsApp support button
- [x] All labels bilingual FR + AR

### [x] 1.8 Admin Panel — `/admin/chauffeurs` (Protected) ✅
- [x] Top metrics: En attente (yellow) / Approuvés today (green) / Rejetés today (red)
- [x] Data Table (`components/admin/DriverTable.tsx`)
  - [x] Columns: Date, Nom, Téléphone, Véhicule (Type + Plate), Statut (Badge)
  - [x] Row Click -> Opens Modal or Sidepanel with full details + uploaded documents
- [x] Action buttons (Approuver / Rejeter)flow: button → PATCH `status='approved'` → SMS to driver
- [x] Reject flow: dropdown of 6 predefined reasons → PATCH `status='rejected'` + reason → SMS with reason + resubmit link
- [x] Supabase RLS: drivers see own record, admin_users see all

### [x] 1.9 Legal Pages (Required for App Store) ✅
- [x] `/conditions-utilisation` — Terms of Service
- [x] `/politique-confidentialite` — Privacy Policy
- [x] `/politique-annulation` — Cancellation Policy
- [x] `/accord-chauffeur` — Driver Agreement
- [x] `/cookies` — Cookie Policy

---

## Phase 2 — Core Platform Features (Supabase Backend)

### [x] 2.1 Database Schema — Core Tables ✅
- [x] `users` table (id, phone, first_name, last_name, email, city, role, referral_code, referred_by, credit_balance, loyalty_points, is_online, last_online_at, account_status, account_type, terms_accepted_at)
- [x] `drivers` table extensions (cin_number, cin_expiry, date_of_birth, vehicle_*, doc_*, status, rejection_reason, approved_at, approved_by)
- [x] `jobs` table (id, client_id, service_type, pickup_*, dropoff_*, description, photo_urls[], stops JSONB, load_capacity, client_budget, preferred_time, payment_method, scheduled_at, time_slot, status, accepted_bid_id, commission_rate, commission_amount, driver_payout, paymee_ref, insurance_selected, delivery_photo_*, receipt_url, cancelled_by/reason/fee/at, preferred_driver_id, is_return_trip)
- [x] `bids` table (id, job_id, driver_id, amount INTEGER, note, estimated_duration_minutes, status, UNIQUE(job_id, driver_id))
- [x] `conversations` table (id, job_id, driver_id, client_id, phase, UNIQUE(job_id, driver_id))
- [x] `messages` table (id, conversation_id, sender_id, sender_type, type, content, media_url, media_duration, location_lat/lng/label, created_at, read_at)
- [x] `reviews` table (id, job_id, reviewer_id, reviewee_id, reviewer_type, stars 1-5, comment, tags[])
- [x] `referrals` table (id, referrer_id, referred_id, status, rewarded_at, job_id, no_self_referral constraint)
- [x] `disputes` table (id, job_id, opened_by, opened_type, reason, description, photo_urls[], status, resolution, resolved_by/at)
- [x] `driver_locations` table (driver_id PK, job_id, lat, lng, heading, speed, accuracy, updated_at)
- [x] `withdrawals` table (id, driver_id, amount, method, account_ref, status, processed_at)
- [x] `promo_codes` table (id, code UNIQUE, discount_type, discount_value, max_uses, uses_per_user, current_uses, min_job_amount, valid_from/until, is_active)
- [x] `wallet_transactions` table (id, user_id, amount, type, job_id, note)
- [x] `loyalty_transactions` table (id, user_id, points, type, job_id)
- [x] `notifications` table (id, user_id, type, title, body, data JSONB, read_at)
- [x] `push_tokens` table (id, user_id, token, platform, is_active)
- [x] `saved_addresses` table (id, user_id, label, address, lat, lng, floor, is_default)
- [x] `favorite_drivers` table (id, client_id, driver_id, UNIQUE)
- [x] `sos_events` table (id, job_id, user_id, user_type, lat, lng, resolved)
- [x] `reports` table (id, reporter_id, reported_id, job_id, reason, description, status)
- [x] `admin_actions` table (admin_id, action, target, timestamp)

### [x] 2.2 Bids System ✅
- [x] Open auction, budget ceiling, fixed price, and negotiation modes
- [x] Bid lifecycle: pending → accepted | rejected | expired | withdrawn
- [x] Rules: one bid/driver/job, driver must be approved, amount > 0 TND, driver ≠ client
- [x] On accept: auto-reject other bids, upgrade conversation phase, SMS both parties
- [x] Client bid display: sorted by price ASC, "Meilleure offre" badge for best, sort by price/rating/time
- [x] 48h auto-expiry for jobs with no accepted bid

### [x] 2.3 Messaging System ✅
- [x] Two-phase chat: pre-bid (text + quick replies only) → post-acceptance (all types enabled)
- [x] Message types: text, voice (WebM/MP4), photo (JPEG/PNG 5MB), location (lat/lng), system
- [x] System messages auto-injected on: bid received, bid accepted, payment set, driver en route, driver arrived, job completed
- [x] 9 quick replies (bilingual FR + AR), contextual by phase + sender_type
- [x] **Anti-abuse**: phone number regex filter in pre-bid, block WhatsApp/Telegram handles, flag after 3 violations
- [x] Supabase Realtime subscriptions for messages INSERT + bids INSERT
- [x] Payment agreement flow in chat after bid acceptance

### [ ] 2.4 Supabase Edge Functions
- [ ] `driver-status-change` — on INSERT (pending) alert admin SMS, on UPDATE (approved) SMS driver, on UPDATE (rejected) SMS with reason
- [ ] `referral-reward` — on job completed: check first job, check pending referral, check monthly cap, credit both 10 TND, SMS both
- [ ] `bid-accepted` — reject other bids, upgrade conversation, SMS both parties, SMS rejected drivers
- [ ] `job-expiry-cron` — auto-expire jobs after 48h, auto-expire bids
- [ ] `eta-calculator` — Google Directions API for ETA every 15s
- [ ] `geofence-arrival` — detect driver within 50m of pickup/dropoff, inject system messages
- [ ] `scheduled-reminder` — SMS 1h before scheduled job
- [ ] `receipt-generator` — PDF generation on job completion (pdfkit for Deno)
- [ ] `sos-alert` — instant admin SMS + GPS location on SOS activation
- [ ] `referral-count-reset` — monthly cron to reset `referral_count_month`

### [ ] 2.5 Referral System
- [ ] Auto-generate referral codes on signup (firstName + 2 random digits uppercase)
- [ ] `/invite/{code}` landing page with pre-filled signup
- [ ] "Invitez & Gagnez" page: code display, WhatsApp share button, stats (invited/pending/TND earned)
- [ ] Anti-abuse: credit only after first completed job, max 5/month, no self-referral, OTP per phone
- [ ] WhatsApp pre-written share messages (FR + AR)

### [ ] 2.6 Live Tracking Map (Bolt-style)
- [ ] Google Maps SDK with custom muted style (Bolt-like beige/grey)
- [ ] Custom van SVG marker with GPS heading rotation + animated position
- [ ] GPS pulse ring animation around van
- [ ] Trail polyline (last 50 positions, teal)
- [ ] Planned route polyline (dashed teal from Google Directions)
- [ ] Pickup (A blue pin) + Dropoff (B green pin) markers
- [ ] Bottom sheet: driver card, call/chat/cancel buttons, route stops, progress bar, ETA
- [ ] Status states: Confirmé → En route → Arrivé → En livraison → Terminé
- [ ] Geofence arrival detection (50m radius)
- [ ] Driver GPS broadcast every 3s via `driver_locations` table + Supabase Realtime

### [ ] 2.7 Ratings, Reviews & Disputes
- [ ] Mutual rating: client rates driver (1-5 stars + comment + tags), driver rates client
- [ ] Tags FR: Ponctuel, Soigneux, Communicatif, Professionnel / Respectueux, Colis bien emballé, Facile d'accès
- [ ] Rating prompt 10min after job completion (push notification)
- [ ] Driver public rating = rolling average of last 50 reviews
- [ ] Auto-flag drivers below 3.5 stars for 3+ consecutive reviews
- [ ] Dispute flow: open within 24h → admin sees both sides + chat + photos → resolve (refund/deduct/dismiss/warn/suspend)
- [ ] Job receipt PDF auto-generated on completion

### [ ] 2.8 Payments
- [ ] Commission split: 10-15% to VanZ, rest to driver
- [ ] Online payments via Paymee (TN payment gateway)
- [ ] Cash option: driver collects, VanZ commission deducted from next online payment
- [ ] Driver earnings dashboard: today/week/month + available balance + bar chart
- [ ] Driver withdrawal: min 50 TND, methods (bank/Flouci/PostePay)
- [ ] Promo codes: fixed or percent discount, usage limits, date range, min job amount
- [ ] Credit wallet system (referral + promo credits)

### [ ] 2.9 Notifications
- [ ] Push notifications via Expo Notifications (both iOS + Android)
- [ ] SMS fallback via Twilio for high-priority notifications
- [ ] In-app notification center with bell icon + unread badge
- [ ] Client notifications: new bid, bid confirmed, driver en route, driver arrived, job completed, refund, dispute resolved, referral reward, scheduled reminder, promo
- [ ] Driver notifications: new job nearby, bid accepted/rejected, new message, rebook request, withdrawal processed, low rating, document expiry, return trip available
- [ ] Email via Resend.com (optional, for B2B clients)

---

## Phase 3 — Full Admin Dashboard

### [ ] 3.1 Admin Pages (Next.js `/admin`)
- [ ] `/admin` — Metrics: GMV, jobs completed, active drivers, open jobs, commission earned. Charts: jobs/day + revenue/day last 30 days
- [ ] `/admin/chauffeurs` — Driver verification queue (already specced in 1.8)
- [ ] `/admin/jobs` — All jobs table with filters (status, city, date), detail view, cancel button
- [ ] `/admin/users` — Search by phone/name, view profile, warn/suspend/ban actions
- [ ] `/admin/disputes` — Open disputes queue, both sides + chat + proof, resolve actions
- [ ] `/admin/promos` — Create/edit/disable promo codes with usage stats
- [ ] `/admin/withdrawals` — Pending driver payouts, mark as processed
- [ ] `/admin/notifications` — Bulk message sender (push/SMS to all users/drivers/specific city)

### [ ] 3.2 User Moderation
- [ ] Warn (system notification)
- [ ] Suspend 7 days (can't login, jobs cancelled)
- [ ] Ban permanent (phone + device blacklisted)
- [ ] Auto-suspend: 3 reports on same user within 30 days

---

## Phase 4 — Mobile App (React Native + Expo)

### [ ] 4.1 App Setup + Navigation
- [ ] React Native 0.73 + Expo SDK 50 + TypeScript
- [ ] Expo Router (file-based navigation)
- [ ] NativeWind (Tailwind for RN) with VanZ custom colors
- [ ] Zustand for state management
- [ ] @supabase/supabase-js for backend
- [ ] expo-font with Cairo + Plus Jakarta Sans
- [ ] Two-mode system: Client mode + Driver mode (same app)
- [ ] Root layout auth redirect logic (no session → auth, no mode → selector, driver not approved → onboarding)
- [ ] Mode selector screen: navy bg, vanZ logo, "Je cherche un van" (teal) + "Je suis chauffeur" (white outline)
- [ ] Auth screens: phone.tsx (+216) + otp.tsx (6-digit)

### [ ] 4.2 Client Mode Screens
- [ ] **(client)/home.tsx** — Service chips, recent jobs, CTA to post job
- [ ] **post-job/step1-4.tsx** — 4-step wizard (Addresses → Details+Photos → Timing+Budget → Confirm+Insurance)
- [ ] **jobs/index.tsx** — My jobs list
- [ ] **jobs/[id]/index.tsx** — Job detail + bids list (Supabase Realtime, "Meilleure offre" badge)
- [ ] **jobs/[id]/tracking.tsx** — Live GPS tracking map (Bolt-style, bottom sheet, SOS)
- [ ] **jobs/[id]/review.tsx** — Post-job review (1-5 stars + tags)
- [ ] **chat/index.tsx** — All conversations list
- [ ] **chat/[id].tsx** — Chat screen (shared, two-phase, voice/photo/location)
- [ ] **profile/index.tsx** — Profile + settings + mode switch
- [ ] **profile/saved-addresses.tsx** — Manage saved addresses
- [ ] **profile/wallet.tsx** — Credits + loyalty points
- [ ] **profile/invite.tsx** — Referral code + share

### [ ] 4.3 Driver Mode Screens
- [ ] **(driver)/home.tsx** — Online/offline toggle, today's earnings, nearby jobs, return trips
- [ ] **jobs/index.tsx** — Job feed with filters (city, distance, load, price, photos), Realtime highlights
- [ ] **jobs/[id].tsx** — Job detail + bid form (price, note, duration)
- [ ] **chat/** — Same shared chat component
- [ ] **earnings/index.tsx** — Balance card, stats, bar chart, job history with commission breakdown
- [ ] **earnings/withdraw.tsx** — Withdrawal form (amount, method, account ref)
- [ ] **profile/index.tsx** — Rating, vehicle info, shareable profile link
- [ ] **profile/documents.tsx** — Upload/update documents

### [ ] 4.4 Driver Onboarding Wizard (App)
- [ ] `onboarding/step1.tsx` — Identity + CIN (camera capture for CIN photos with border guide)
- [ ] `onboarding/step2.tsx` — Vehicle details
- [ ] `onboarding/step3.tsx` — Document uploads
- [ ] `onboarding/pending.tsx` — Verification pending (Realtime: auto-navigate on approval)

### [ ] 4.5 Platform Builds
- [ ] Android build first (80% of Tunisia market, faster Play Store approval)
- [ ] iOS build (requires Apple Developer $99/yr)
- [ ] PWA export for web deployment alongside Next.js

---

## Phase 5 — Growth & Advanced Features

### [ ] 5.1 Job Posting Extras
- [ ] Photo uploads (up to 5 per job)
- [ ] Multi-stop jobs (A → B → C, up to 4 stops, +15 TND/stop)
- [ ] Scheduled jobs (date picker + time slot: morning/afternoon/evening, reminder SMS 1h before)
- [ ] Saved addresses (home, work, custom)
- [ ] Re-book same driver (1-tap, preferred_driver_id, 30min priority window)

### [ ] 5.2 Trust & Safety
- [ ] SOS emergency button (3s hold → admin SMS + GPS, Edge Function)
- [ ] Item damage insurance upsell (+5 TND, coverage up to 200 TND)
- [ ] Report driver/client (5 predefined reasons, auto-suspend after 3 reports/30 days)
- [ ] Proof of delivery photo (required to mark job complete, GPS-tagged + timestamped)

### [ ] 5.3 Growth Features
- [ ] Loyalty points system (100pts first job, 10pts/TND, 20pts review, 150pts referral → redeem for discounts)
- [ ] B2B/Corporate accounts (reduced commission 8%, monthly invoices, team accounts, API access)
- [ ] Favorite drivers (heart icon, "Mes favoris" tab, priority notification)
- [ ] Empty return trip matching (after dropoff, show jobs near current location heading home)

### [ ] 5.4 SEO Ongoing
- [ ] 2 blog articles per week (600+ words each)
- [ ] New city pages monthly (neighborhoods, routes)
- [ ] Backlink building (Facebook groups, real estate agencies, furniture stores, directories)
- [ ] Monitor Google Search Console
- [ ] Unique content per page — NO copy-paste

---

## ⚠️ Critical Rules (NEVER Break)

1. **Currency**: Always TND (دينار), never $ or €
2. **Language**: French primary, Arabic secondary — no English on the website
3. **Phone format**: +216 XX XXX XXX (Tunisian)
4. **Styling**: NativeWind (Tailwind for RN) for mobile, Tailwind CSS for web — no raw StyleSheet objects
5. **Database**: All queries through Supabase — never drop `Auctions` table, soft-delete only
6. **3D at launch**: DO NOT add Three.js at launch — SEO performance first, add later
7. **Mock data**: Use mock data arrays for launch — no live Supabase connection initially for homepage
8. **No CSS-in-JS**: Only Tailwind utility classes
9. **No paid assets**: Use SVG illustrations or emoji icons only
10. **Performance**: Lighthouse 90+ on mobile, LCP < 2.5s, lazy-load 3D, `next/image` with webp
