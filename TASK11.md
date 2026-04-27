# VanZ — Implementation Plan

> Plan de remédiation des bugs identifiés au code review (avril 2026).
> 28 tâches réparties en 4 phases. À exécuter dans l'ordre — chaque phase est déployable indépendamment.

## Légende

- 🔴 **Critique** — bloquant deploy, sécurité ou correctness
- 🟠 **Important** — bug fonctionnel ou data loss
- 🟡 **Polish** — perf, UX, maintainability

**Total estimé : 22-30h de travail focused.**

## Comment utiliser ce fichier

1. Une tâche = une PR / un commit. Ne pas batcher.
2. Cocher la case `[ ]` → `[x]` une fois mergé en main.
3. Avant de commencer une tâche, créer une branche `fix/TASK-X.Y-short-name`.
4. Tester localement (smoke test décrit en bas) avant de merge.
5. Phase 0 doit être 100% terminée AVANT le premier déploiement de prod.

---

## 📋 Récap par phase

| Phase | Scope | Durée | Bloque deploy ? |
|---|---|---|---|
| **0** | Showstoppers (sécurité + statuts cassés) | 4-6h | ✅ OUI |
| **1** | Backend integrity (race conditions, uploads) | 6-8h | ✅ OUI (avant 1er paiement) |
| **2** | Performance & data quality | 4-6h | ❌ Non |
| **3** | Polish (tests, CORS, monitoring) | 6-10h | ❌ Non |

---

# 🔴 PHASE 0 — Showstoppers

> À FAIRE AVANT TOUT DÉPLOIEMENT. Sans Phase 0, le code en prod = sécurité compromise + paiements cassés.

## [x] TASK-0.1 — Fixer le pipeline de statuts

**🔴 Critique · 45min · Bloque toute la chaîne paiement/tracking**

### Problème
Le `CHECK constraint` sur `jobs.status` n'inclut pas les statuts utilisés par le code :
- `paymee-webhook` → `'paid'` ❌
- `geofence-arrival` → `'confirmed'` (check) ❌  
- `geofence-arrival` → `'arrived_dropoff'` (update) ❌

Conséquence : webhook Paymee throw silencieusement, geofence ne déclenche jamais.

### Fichiers
- `supabase/004_status_pipeline.sql` (nouveau)
- `supabase/functions/paymee-webhook/index.ts`
- `supabase/functions/geofence-arrival/index.ts`
- `supabase/functions/bid-accepted/index.ts`

### Steps

1. Créer `supabase/004_status_pipeline.sql` :

```sql
-- Update job status enum to match code reality
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'open',
    'matched',
    'paid',
    'confirmed',
    'in_progress',
    'arrived_pickup',
    'arrived_dropoff',
    'completed',
    'cancelled',
    'expired'
  ));

-- Optional: index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
```

2. Standardiser les transitions dans le code :
   - `bid-accepted` → set `status = 'confirmed'` (au lieu de `'matched'`)
   - `paymee-webhook` → set `status = 'paid'` (déjà OK une fois constraint élargie)
   - `geofence-arrival` (pickup) → check `status = 'confirmed'`, set `'arrived_pickup'`
   - `geofence-arrival` (dropoff) → check `status = 'in_progress'`, set `'arrived_dropoff'`

### Acceptance
- [ ] Migration appliquée sur DB
- [ ] Test : créer un job, accepter un bid, vérifier status = `'confirmed'`
- [ ] Test : payer via Paymee sandbox, vérifier status devient `'paid'` sans erreur SQL
- [ ] Aucune occurrence de statut hors-enum dans les Edge Functions (`grep -r "status:.*'.*'" supabase/functions/`)

---

## ☐ TASK-0.2 — Supprimer dev bypasses du bundle production

**🔴 Critique · 30min · Auth admin contournable depuis le client**

### Problème
- `Step1Phone.tsx` : phone `22222222` + OTP `123456` hardcodés
- `admin/layout.tsx` : `NEXT_PUBLIC_DEV_MODE=true` skip toute l'auth admin
- `NEXT_PUBLIC_*` est shippé dans le bundle JS client → visible par tout le monde

### Fichiers
- `components/drivers/Step1Phone.tsx`
- `app/[locale]/admin/layout.tsx`
- `.env.local` (à mettre à jour localement, pas commit)
- `DEV_NOTES.md` (mettre à jour)

### Steps

1. Dans `components/drivers/Step1Phone.tsx`, supprimer entièrement les blocs :
```ts
// SUPPRIMER
if (data.phone === "22222222") { ... }
if (data.phone === "22222222" && data.otp === "123456") { ... }
```

2. Dans `app/[locale]/admin/layout.tsx`, supprimer :
```ts
// SUPPRIMER
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
// ... et tous les `if (IS_DEV_MODE)` blocks
// ... et le banner "MODE DÉVELOPPEMENT"
```

3. Pour garder un dev-mode local sans risque prod, utiliser une env var **côté serveur uniquement** (sans `NEXT_PUBLIC_`) :
```ts
// next.config.ts
const nextConfig = {
  env: {
    DEV_AUTH_BYPASS: process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === '1' ? '1' : '',
  }
};
```
Et l'utiliser uniquement dans Server Components / API routes, jamais dans Client Components.

4. Mettre à jour `DEV_NOTES.md` pour retirer la doc des bypasses.

### Acceptance
- [ ] `grep -r "22222222" components/` → vide
- [ ] `grep -r "NEXT_PUBLIC_DEV_MODE" .` → vide
- [ ] Test : aller sur `/admin` sans session → redirige vers login
- [ ] Build prod (`npm run build`) ne contient plus les strings de bypass : `grep "22222222" .next/static/chunks/*.js`

---

## ☐ TASK-0.3 — Bloquer privilege escalation au signup

**🔴 Critique · 20min · Privilege escalation via metadata**

### Problème
Le trigger `handle_new_user` accepte n'importe quelle valeur `role` envoyée dans les metadata du signup. Un user peut s'inscrire avec `role: 'admin'` et recevoir alors les notifications SOS (qui filtrent sur `role='admin'` dans `users`).

### Fichiers
- `supabase/schema.sql` (fonction `handle_new_user`)
- Nouvelle migration : `supabase/005_security_triggers.sql`

### Steps

1. Créer `supabase/005_security_triggers.sql` :

```sql
-- Patch: handle_new_user MUST hardcode role='client'
-- Promotion to driver/admin happens via separate flows (driver wizard, admin SQL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'VanZ'),
    'client'  -- Hardcoded. Promotion goes through controlled flows.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Mettre à jour `schema.sql` pour refléter (idempotency).

3. Pour la promotion driver, utiliser une Edge Function avec service_role (déjà invoquée à la fin du wizard).

4. Audit : vérifier qu'aucun user existant n'a `role='admin'` dans `users` :
```sql
SELECT id, phone, role FROM public.users WHERE role = 'admin';
-- Si présent et non-attendu : UPDATE public.users SET role = 'client' WHERE id = '...';
```

### Acceptance
- [ ] Test : signup avec `data: { role: 'admin' }` dans options → `users.role` = `'client'`
- [ ] Aucun user en DB avec `role='admin'` qui n'a pas une row dans `admin_users`

---

## ☐ TASK-0.4 — Fixer RLS qui leak les users

**🔴 Critique · 30min · PII exposed**

### Problème
La policy `users_read_own_or_admin` permet à tout user authentifié de lire **tous** les profils où `account_status='active'`, exposant phone/email/credit_balance.

### Fichiers
- `supabase/002_rls_policies.sql`
- Composants qui select sur `users` : `components/jobs/BidsList.tsx`, etc.

### Steps

1. Mettre à jour `supabase/002_rls_policies.sql` :

```sql
DROP POLICY IF EXISTS "users_read_own_or_admin" ON public.users;
CREATE POLICY "users_read_own_or_admin" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Vue publique pour les infos non-sensibles
CREATE OR REPLACE VIEW public.users_public AS
  SELECT id, first_name, last_name, cached_rating, total_reviews, role, city
  FROM public.users
  WHERE account_status = 'active';

GRANT SELECT ON public.users_public TO anon, authenticated;
```

2. Refactor du code qui lit des users d'autrui :
   - `components/jobs/BidsList.tsx` ligne ~52 : `from('users')` → `from('users_public')`
   - Tout autre `from('users').select('first_name, last_name')` → idem

### Acceptance
- [ ] Test : se connecter en tant que user A, query `from('users').select('phone').eq('id', userB)` → 0 rows
- [ ] BidsList.tsx affiche toujours nom + rating correctement
- [ ] `grep -r "from('users')" components/` review → soit `users_public`, soit query explicitement de soi-même

---

## ☐ TASK-0.5 — Vérification signature webhook Paymee

**🔴 Critique · 1h · Anyone can mark jobs as paid**

### Problème
`paymee-webhook` accepte n'importe quel POST. Attacker peut forger un payload pour marquer un job comme payé sans payer.

### Fichiers
- `supabase/functions/paymee-webhook/index.ts`
- `.env` Supabase (env var `PAYMEE_VENDOR_TOKEN`)

### Steps

1. Vérifier la doc Paymee pour le format exact du `check_sum` (généralement MD5 d'une concat). Selon doc Paymee v2 :
```
check_sum = MD5(token + amount + payment_status + vendor_token)
```

2. Implémenter dans `paymee-webhook/index.ts` :

```ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function md5(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const VENDOR_TOKEN = Deno.env.get("PAYMEE_VENDOR_TOKEN") ?? "";
    
    // 1. Verify signature
    const expected = await md5(
      `${payload.token}${payload.amount}${payload.payment_status ? "1" : "0"}${VENDOR_TOKEN}`
    );
    if (payload.check_sum?.toLowerCase() !== expected.toLowerCase()) {
      console.error('[paymee-webhook] Invalid check_sum');
      return new Response('Invalid signature', { status: 401 });
    }

    if (payload.payment_status !== true) {
       return new Response('Payment not completed', { status: 200 });
    }

    // 2. Extract job_id from query param (cf TASK-1.3)
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    if (!jobId) return new Response('Missing job_id', { status: 400 });

    // ... rest of logic (unchanged)
  } catch (err) {
    console.error('[paymee-webhook]', err);
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
});
```

3. Ajouter `PAYMEE_VENDOR_TOKEN` aux secrets Supabase :
```bash
supabase secrets set PAYMEE_VENDOR_TOKEN=xxx
```

### Acceptance
- [ ] Test : POST manuel sans `check_sum` → 401
- [ ] Test : POST manuel avec faux `check_sum` → 401  
- [ ] Test : paiement réel via Paymee sandbox → webhook valide la signature et marque `'paid'`

---

## ☐ TASK-0.6 — Auth des autres webhooks Edge Functions

**🔴 Critique · 1h · Anyone can spoof state changes**

### Problème
Les Edge Functions `bid-accepted`, `job-completed`, `referral-reward`, `geofence-arrival`, `driver-status-change` sont déclenchées par triggers SQL via `pg_net`. Mais **aucune ne valide l'authenticité du caller**. URL connue = état modifiable.

### Fichiers
- Tous les Edge Functions sauf `paymee-webhook` (qui a sa propre signature)
- `supabase/003_webhooks.sql` + `supabase/schema.sql` (triggers)

### Steps

1. Générer un secret partagé fort :
```bash
openssl rand -hex 32
# ex: a1b2c3...
```

2. Le set comme secret Supabase **et** comme setting Postgres :
```bash
supabase secrets set EDGE_WEBHOOK_SECRET=a1b2c3...
```
```sql
ALTER DATABASE postgres SET app.settings.edge_webhook_secret = 'a1b2c3...';
```

3. Mettre à jour les triggers SQL pour utiliser ce secret au lieu du service_role_key :
```sql
-- Dans toutes les fonctions notify_* (bid_accepted, job_completed_referral, etc.)
PERFORM net.http_post(
  url := ...,
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-Edge-Secret', current_setting('app.settings.edge_webhook_secret', true)
  ),
  body := ...
);
```

4. Helper partagé pour la vérif :
```ts
// supabase/functions/_shared/auth.ts (nouveau)
export function verifyWebhookSecret(req: Request): boolean {
  const provided = req.headers.get('x-edge-secret');
  const expected = Deno.env.get('EDGE_WEBHOOK_SECRET');
  return !!provided && !!expected && provided === expected;
}
```

5. Au début de chaque Edge Function (sauf paymee-webhook) :
```ts
import { verifyWebhookSecret } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest
});
```

### Acceptance
- [ ] curl POST sans header → 401 sur bid-accepted, job-completed, referral-reward, geofence-arrival, driver-status-change
- [ ] Trigger SQL fonctionne (test : accepter un bid → SMS reçus)
- [ ] `_shared/auth.ts` créé et importé partout

---

## ☐ TASK-0.7 — Sortir secrets hardcodés en env vars

**🔴 Critique · 20min**

### Problème
- `sos-alert/index.ts` : `const adminPhone = "+21651905711" || ...` (numéro réel hardcodé, fallback dead-code)
- `paymee-create/index.ts` : URL sandbox en dur, et `process.env.BASE_URL` (Node syntax dans Deno)

### Fichiers
- `supabase/functions/sos-alert/index.ts`
- `supabase/functions/paymee-create/index.ts`

### Steps

1. `sos-alert/index.ts` :
```ts
// AVANT
const adminPhone = "+21651905711" || "+21600000000";

// APRÈS
const adminPhone = Deno.env.get("ADMIN_SOS_PHONE") ?? "";
if (!adminPhone) {
  console.error("[sos-alert] ADMIN_SOS_PHONE not configured");
}
```

2. `paymee-create/index.ts` :
```ts
// AVANT
const BASE_URL = process.env.BASE_URL ?? "https://vanz.tn";
// ...
await fetch('https://sandbox.paymee.tn/api/v2/payments/create', { ... });

// APRÈS
const BASE_URL = Deno.env.get("BASE_URL") ?? "https://vanz.tn";
const PAYMEE_API_URL = Deno.env.get("PAYMEE_API_URL") ?? "https://app.paymee.tn/api/v2/payments/create";
// ...
await fetch(PAYMEE_API_URL, { ... });
```

3. Set les secrets :
```bash
supabase secrets set ADMIN_SOS_PHONE=+216XXXXXXXX
supabase secrets set BASE_URL=https://vanz.tn
supabase secrets set PAYMEE_API_URL=https://sandbox.paymee.tn/api/v2/payments/create  # ou prod
```

### Acceptance
- [ ] `grep -r "+216" supabase/functions/` → vide
- [ ] `grep -r "process\.env" supabase/functions/` → vide
- [ ] `grep -r "sandbox.paymee" supabase/functions/` → vide

---

## ☐ TASK-0.8 — Cleanup repo (gitignore + remove tracked artifacts)

**🟠 Important · 15min · Repo hygiene**

### Problème
Fichiers de build/lint commités (~3MB+ inutiles) :
- `lint_results.json`, `lint_final.json`, `tracker_lint.json`
- `lint_errors.txt`, `local_lint_output.txt`, `final_*.txt`
- `van-z-log-export-2026-04-06T20-33-08.csv`
- `parse_lint.js`, `add_metadata.mjs`, `add_translations.mjs` (scripts one-shot)

### Fichiers
- `.gitignore`
- Suppression files trackés

### Steps

1. Mettre à jour `.gitignore` :
```
# Existing content
/node_modules
/.next/
/out/
.DS_Store
*.pem

# Add the following
.env
.env.local
.env*.local

# Lint artifacts
lint_*.json
lint_*.txt
local_lint_output.txt
tracker_lint.json
final_*.txt
final_*.json

# Build/log exports
*-log-export-*.csv

# IDE
.vscode/
.idea/
.verdent/

# Misc
*.log
```

2. Untrack les fichiers existants :
```bash
git rm --cached lint_*.json lint_*.txt local_lint_output.txt tracker_lint.json
git rm --cached final_*.txt final_*.json
git rm --cached van-z-log-export-*.csv
git rm --cached parse_lint.js
git rm -r --cached .verdent/
```

3. Décider du sort des `add_*.mjs` :
   - Si scripts utiles à garder → bouger dans `scripts/` avec un README
   - Si one-shot, les supprimer

### Acceptance
- [ ] `git ls-files | grep -E "(lint_|final_|log-export)" ` → vide
- [ ] Repo size après ce cleanup ~30-40% plus petit

---

# 🟠 PHASE 1 — Backend integrity

> Avant le premier paiement réel + 1ère vague de drivers en prod.

## ☐ TASK-1.1 — Buckets privés / Signed URLs

**🔴 Critique · 1.5h · Documents drivers actuellement inaccessibles**

### Problème
`lib/upload.ts` appelle `getPublicUrl()` sur des buckets privés. L'URL retournée est inaccessible. Les CIN, permis, assurances uploadés sont stockés mais **non lisibles par l'admin** au moment de la review.

### Fichiers
- `lib/upload.ts`
- `components/drivers/Step2Identity.tsx`
- `components/drivers/Step3Vehicle.tsx`
- `components/drivers/Step4Documents.tsx`
- `components/jobs/DeliveryProofUpload.tsx`
- `app/[locale]/admin/drivers/page.tsx`
- `app/[locale]/admin/disputes/page.tsx`

### Steps

1. Refactor `lib/upload.ts` :

```ts
import { datasql as supabase } from "./datasql";

/**
 * Uploads a file to a private Supabase Storage bucket.
 * Returns the storage path (NOT a URL). Use getSignedUrl() to read.
 */
export async function uploadFile(bucket: string, filePath: string, file: Blob | File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return data.path; // ex: "userId/cinFrontUrl_1234.jpg"
}

/**
 * Generate a temporary signed URL for a private file.
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
```

2. Dans les Steps wizard, stocker juste le `path` retourné :
```ts
// Step2Identity.tsx, Step3Vehicle.tsx, Step4Documents.tsx
const path = await uploadFile('driver-documents', filePath, file);
updateData({ [key]: path }); // store path, not URL
```

3. Dans les pages admin, générer signed URLs au moment de l'affichage :
```ts
// app/[locale]/admin/drivers/page.tsx (côté affichage)
const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

useEffect(() => {
  if (!selectedDriver) return;
  Promise.all([
    getSignedUrl('driver-documents', selectedDriver.cin_front_url),
    getSignedUrl('driver-documents', selectedDriver.cin_back_url),
    // ... etc
  ]).then(([cinFront, cinBack, ...]) => {
    setSignedUrls({ cinFront, cinBack, ... });
  });
}, [selectedDriver]);
```

4. Pour les drivers existants en DB qui ont déjà des URLs publiques (cassées) :
```sql
-- Migration data: extract path from broken URLs
UPDATE public.drivers
SET cin_front_url = regexp_replace(cin_front_url, '^.*/(.+/.+)$', '\1')
WHERE cin_front_url LIKE 'http%';
-- Same for cin_back_url, doc_*, vehicle_photo_url
```

### Acceptance
- [ ] Upload nouveau driver → `drivers.cin_front_url` contient `userId/filename.jpg` (pas une URL)
- [ ] Page admin drivers → CIN affichées correctement (signed URL fonctionne)
- [ ] L'URL signée expire après 1h

---

## ☐ TASK-1.2 — Atomic increments (race conditions)

**🔴 Critique · 1.5h · Promo épuisable infiniment + double crédit driver**

### Problème
- `apply-promo` : double-update non-atomic (RPC + UPDATE direct) écrase l'increment
- `job-completed` : check `commission_amount IS NULL` puis update séparé → window race → double crédit

### Fichiers
- `supabase/006_atomic_helpers.sql` (nouveau)
- `supabase/functions/apply-promo/index.ts`
- `supabase/functions/job-completed/index.ts`

### Steps

1. Créer `supabase/006_atomic_helpers.sql` :

```sql
-- Atomic promo increment with all checks at SQL level
CREATE OR REPLACE FUNCTION public.try_use_promo(
  p_code text,
  p_user_id uuid,
  p_job_amount numeric
)
RETURNS TABLE(success boolean, discount numeric, error_msg text) AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_user_uses int;
  v_discount numeric;
BEGIN
  SELECT * INTO v_promo FROM public.promo_codes 
  WHERE code = upper(p_code) AND is_active = true FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code invalide';
    RETURN;
  END IF;
  
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code expiré';
    RETURN;
  END IF;
  
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code épuisé';
    RETURN;
  END IF;
  
  IF p_job_amount < v_promo.min_job_amount THEN
    RETURN QUERY SELECT false, 0::numeric, format('Minimum %s TND requis', v_promo.min_job_amount);
    RETURN;
  END IF;
  
  SELECT count(*) INTO v_user_uses
  FROM public.wallet_transactions
  WHERE user_id = p_user_id AND type = 'promo' AND note = upper(p_code);
  
  IF v_user_uses >= COALESCE(v_promo.uses_per_user, 1) THEN
    RETURN QUERY SELECT false, 0::numeric, 'Déjà utilisé';
    RETURN;
  END IF;
  
  v_discount := CASE 
    WHEN v_promo.discount_type = 'fixed' THEN v_promo.discount_value
    ELSE round(p_job_amount * v_promo.discount_value / 100, 2)
  END;
  v_discount := LEAST(v_discount, p_job_amount);
  
  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;
  
  RETURN QUERY SELECT true, v_discount, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic job completion: only proceed if commission_amount IS NULL
CREATE OR REPLACE FUNCTION public.complete_job_atomic(
  p_job_id uuid,
  p_amount numeric,
  p_rate numeric
)
RETURNS TABLE(commission numeric, payout numeric) AS $$
DECLARE
  v_commission numeric;
  v_payout numeric;
BEGIN
  v_commission := round(p_amount * p_rate, 2);
  v_payout := p_amount - v_commission;
  
  UPDATE public.jobs
  SET commission_amount = v_commission,
      driver_payout = v_payout
  WHERE id = p_job_id AND commission_amount IS NULL;
  
  IF NOT FOUND THEN
    RETURN; -- Already processed, return empty
  END IF;
  
  RETURN QUERY SELECT v_commission, v_payout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Refactor `apply-promo/index.ts` (whole body) :

```ts
const { data, error } = await supabaseAdmin.rpc('try_use_promo', {
  p_code: code,
  p_user_id: userId,
  p_job_amount: jobAmount
});

if (error) throw error;
const result = data?.[0];
if (!result?.success) {
  return new Response(JSON.stringify({ error: result?.error_msg ?? 'Erreur inconnue' }), { status: 400 });
}

return new Response(JSON.stringify({ ok: true, discount: result.discount }), { status: 200 });
```

3. Refactor `job-completed/index.ts` :

```ts
const { data: result } = await supabaseAdmin.rpc('complete_job_atomic', {
  p_job_id: jobId,
  p_amount: acceptedAmount,
  p_rate: rate
});

if (!result || result.length === 0) {
  return new Response(JSON.stringify({ ok: true, msg: 'Already processed' }), { status: 200 });
}

const { commission, payout } = result[0];
// ... rest unchanged
```

### Acceptance
- [ ] Test concurrence : run 5 `apply-promo` en parallèle pour le même code (quasi-épuisé) → max_uses respecté exactement
- [ ] Test : invoquer 2x `job-completed` pour le même jobId → 1 seul crédit driver
- [ ] `current_uses` jamais > `max_uses`

---

## ☐ TASK-1.3 — Job ID en query param sur webhook Paymee

**🟠 Important · 30min · Robustesse**

### Problème
Extraction du job_id par parse string du `note` field. Fragile.

### Fichiers
- `supabase/functions/paymee-create/index.ts`
- `supabase/functions/paymee-webhook/index.ts`

### Steps

1. `paymee-create/index.ts` :
```ts
const SUPABASE_FUNCTIONS_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1";
// ...
body: JSON.stringify({
  // ...
  webhook_url: `${SUPABASE_FUNCTIONS_URL}/paymee-webhook?job_id=${job.id}`
})
```

2. `paymee-webhook/index.ts` :
```ts
const url = new URL(req.url);
const jobId = url.searchParams.get('job_id');
if (!jobId) return new Response('Missing job_id', { status: 400 });

// Plus besoin de parser webhookPayload.note
```

### Acceptance
- [ ] Test : créer paiement, voir webhook URL contient `?job_id=...`
- [ ] Webhook handler ne dépend plus du format du `note` field

---

## ☐ TASK-1.4 — Fix duplicate `admin_actions` table

**🟠 Important · 15min · Schema bug**

### Problème
`admin_actions` défini deux fois dans `schema.sql`. À cause de `IF NOT EXISTS`, la 1ère version (admin_id text, sans FK) gagne. La 2e (admin_id uuid + FK admin_users) est ignorée.

### Fichiers
- `supabase/schema.sql`
- `supabase/007_admin_actions_fix.sql` (nouveau)

### Steps

1. Créer `supabase/007_admin_actions_fix.sql` :
```sql
-- Drop & recreate with correct types
DROP TABLE IF EXISTS public.admin_actions CASCADE;
CREATE TABLE public.admin_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id uuid,
  data jsonb,
  amount numeric(10,2),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Re-enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_access" ON public.admin_actions;
CREATE POLICY "admin_only_access" ON public.admin_actions
  FOR ALL USING (public.is_admin());

CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id, created_at DESC);
```

2. Mettre à jour `schema.sql` : supprimer la **1ère** déclaration (ligne ~196), garder la 2e corrigée.

### Acceptance
- [ ] `\d public.admin_actions` montre `admin_id uuid` avec FK
- [ ] Pas de doublon de CREATE TABLE dans `schema.sql`

---

## ☐ TASK-1.5 — Fixer N+1 queries dans BidsList

**🟠 Important · 1h · Performance + data correctness**

### Problème
`BidsList.tsx` fait 3 queries par bid (users, drivers, reviews). 10 bids = 30 round-trips. De plus, le subscription Realtime hardcode `rating: 4.8, jobs_count: 0` pour les nouveaux bids.

### Fichiers
- `components/jobs/BidsList.tsx`

### Steps

1. Single query avec joins :
```ts
const fetchBids = async () => {
  const { data } = await datasql
    .from('bids')
    .select(`
      id, amount, note, estimated_duration_minutes, driver_id, status,
      drivers!inner(
        vehicle_type,
        users:id(first_name, last_name, cached_rating, total_reviews)
      )
    `)
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .order('amount', { ascending: true });

  if (data) {
    const enriched = data.map(bid => ({
      ...bid,
      driver: {
        first_name: bid.drivers?.users?.first_name || 'Chauffeur',
        last_name: bid.drivers?.users?.last_name || '',
        vehicle_type: bid.drivers?.vehicle_type || 'van',
        rating: bid.drivers?.users?.cached_rating || 0,
        jobs_count: bid.drivers?.users?.total_reviews || 0,
      }
    }));
    setBids(enriched);
  }
};
```

2. Pour Realtime INSERT, refetch ce bid spécifique avec le même join :
```ts
.on('postgres_changes', { ... }, async (payload) => {
  const { data: newBid } = await datasql
    .from('bids')
    .select(`id, amount, note, ..., drivers!inner(...)`)
    .eq('id', payload.new.id)
    .single();
  if (newBid) {
    setBids(current => [...current, mapBid(newBid)].sort((a,b) => a.amount - b.amount));
  }
});
```

3. Cleanup : ajouter `locale` aux deps du `useEffect` (currently missing).

### Acceptance
- [ ] Avec 5 bids, Network tab montre 1 query au lieu de 16
- [ ] Nouveaux bids affichent rating réel (depuis `cached_rating`), pas 4.8 hardcodé
- [ ] No lint warning sur exhaustive-deps

---

## ☐ TASK-1.6 — Feedback UI sur géoloc refusée

**🟡 Polish · 30min · UX**

### Problème
`useDriverTracking` log juste `console.error` quand le driver refuse la géoloc. Aucun feedback UI.

### Fichiers
- `hooks/useDriverTracking.ts`
- `components/tracking/DriverBroadcaster.tsx` (consommateur)

### Steps

1. Hook :
```ts
export function useDriverTracking({ driverId, isActive, jobId }: TrackingOptions) {
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  // ...
  const watchId = navigator.geolocation.watchPosition(
    (position) => { setError(null); /* ... */ },
    (err) => setError(err),
    options
  );
  // ...
  return { error };
}
```

2. Composant :
```tsx
const { error } = useDriverTracking({ driverId, isActive, jobId });
if (error) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      Géolocalisation requise pour recevoir des courses. Activez-la dans les paramètres du navigateur.
    </div>
  );
}
```

### Acceptance
- [ ] Refuser géoloc dans navigateur → message d'erreur visible

---

# 🟡 PHASE 2 — Performance & data quality

## ☐ TASK-2.1 — PostGIS proper avec GIST index

**🟡 Polish · 1h · Scale**

### Fichiers
- `supabase/008_postgis_geography.sql` (nouveau)

### Steps

```sql
-- Generated geography column for jobs pickup
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS pickup_geog geography(POINT, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(pickup_lng::float, pickup_lat::float), 4326)::geography
    ELSE NULL END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_pickup_geog ON public.jobs USING GIST (pickup_geog);

-- Faster radius function using ST_DWithin (uses GIST index)
CREATE OR REPLACE FUNCTION get_jobs_within_radius(
  driver_lat numeric, driver_lng numeric, radius_km numeric
)
RETURNS SETOF public.jobs AS $$
  SELECT *
  FROM public.jobs
  WHERE status = 'open'
    AND pickup_geog IS NOT NULL
    AND ST_DWithin(
      pickup_geog,
      ST_SetSRID(ST_MakePoint(driver_lng::float, driver_lat::float), 4326)::geography,
      radius_km * 1000
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Acceptance
- [ ] EXPLAIN ANALYZE sur radius query montre Index Scan, pas Seq Scan
- [ ] Avec 1000 jobs, latence query < 50ms

---

## ☐ TASK-2.2 — Index sur colonnes filtrées chaud

**🟡 Polish · 30min**

### Fichiers
- `supabase/009_indexes.sql` (nouveau)

```sql
CREATE INDEX IF NOT EXISTS idx_bids_job_status ON public.bids(job_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_driver_status ON public.bids(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON public.jobs(client_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status) WHERE status='approved';
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role IN ('driver','admin');
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id, created_at DESC);
```

### Acceptance
- [ ] Toutes les queries listées dans `EXPLAIN ANALYZE` utilisent un index

---

## ☐ TASK-2.3 — Driver location history

**🟡 Polish · 1h · Audit/dispute support**

```sql
CREATE TABLE IF NOT EXISTS public.driver_location_history (
  id bigserial PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  lat numeric(10,8) NOT NULL,
  lng numeric(11,8) NOT NULL,
  heading numeric(5,2),
  speed numeric(5,2),
  recorded_at timestamp with time zone DEFAULT now()
);
CREATE INDEX ON public.driver_location_history (driver_id, recorded_at DESC);
CREATE INDEX ON public.driver_location_history (job_id, recorded_at);

-- Optional: auto-prune older than 90 days via pg_cron
SELECT cron.schedule(
  'driver-location-history-prune',
  '0 3 * * *',
  $$DELETE FROM public.driver_location_history WHERE recorded_at < now() - interval '90 days';$$
);
```

Insert depuis `useDriverTracking` quand `jobId` est actif (1 row toutes les 30s par exemple).

### Acceptance
- [ ] Pendant un job, history se remplit
- [ ] Cron de pruning planifiée

---

## ☐ TASK-2.4 — Codes parrainage robustes

**🟡 Polish · 20min**

`lib/referrals.ts` : passer à 4 chars alphanumériques + retry sur collision.

```ts
export async function checkUserReferralCode(userId: string, firstName: string) {
  const { data: user } = await supabase.from('users').select('referral_code').eq('id', userId).single();
  if (user?.referral_code) return user.referral_code;
  
  for (let i = 0; i < 5; i++) {
    const code = `${firstName.substring(0,3).toUpperCase()}${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    const { error } = await supabase.from('users').update({ referral_code: code }).eq('id', userId);
    if (!error) return code;
    if (!error.message?.includes('duplicate')) throw error;
  }
  throw new Error('Referral code generation failed after 5 attempts');
}
```

### Acceptance
- [ ] Génération produit codes uniques sur 10000 tirages

---

## ☐ TASK-2.5 — Parallel SMS dans `bid-accepted`

**🟡 Polish · 15min**

```ts
// AVANT
for (const b of rejectedBids) {
  await sendSms(...);
  await sendPushNotification(...);
}

// APRÈS
await Promise.allSettled(
  rejectedBids.flatMap(b => [
    sendSms(b.users.phone, '...'),
    sendPushNotification(supabaseAdmin, b.users.id, '...', '...')
  ])
);
```

### Acceptance
- [ ] Latence `bid-accepted` réduite (~3-5x sur 10 rejected bids)

---

# 🟢 PHASE 3 — Polish & long-term

## ☐ TASK-3.1 — CORS headers sur Edge Functions

**🟡 Polish · 30min**

Helper `_shared/cors.ts` :
```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edge-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return null;
}
```
Dans chaque `serve()` :
```ts
const cors = handleCors(req);
if (cors) return cors;
// ... logic
return new Response(JSON.stringify(...), { 
  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
});
```

---

## ☐ TASK-3.2 — Rate limiting sur endpoints publics

**🟡 Polish · 1h**

`apply-promo` et `paymee-create` exposés au browser. Ajouter limit (ex: 5/min/IP) via :
- Postgres : table `rate_limits` + UPSERT/check dans Edge Function
- Ou Upstash Redis si Supabase ne suffit pas

---

## ☐ TASK-3.3 — Setup framework de tests

**🟡 Polish · 2h**

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
npm i -D @playwright/test
```

Premiers tests :
- Unit : `lib/referrals.ts`, hooks calculs
- Edge Functions : test apply-promo logic (mocking Supabase client)
- E2E Playwright : signup driver, post job, accept bid, paiement sandbox

---

## ☐ TASK-3.4 — CI GitHub Actions

**🟡 Polish · 1h**

`.github/workflows/ci.yml` :
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
```

---

## ☐ TASK-3.5 — Error tracking (Sentry)

**🟡 Polish · 1h**

```bash
npm i @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
Ajouter aussi côté Edge Functions un wrapper `try/catch` qui envoie à Sentry.

---

## ☐ TASK-3.6 — Retirer `// @ts-nocheck`

**🟡 Polish · 2-3h**

Une fonction à la fois. Chaque file Edge Function commence par `// @ts-nocheck` qui masque des bugs réels (typos, mauvais return types). Retirer et fixer les types un par un.

Ordre suggéré (du plus simple au plus complexe) :
1. `_shared/push.ts` (déjà petit)
2. `apply-promo`, `eta-calculator`, `referral-count-reset`
3. `bid-accepted`, `job-completed`, `geofence-arrival`
4. `paymee-*`

Pour les types Deno.env, créer un `_shared/env.ts` :
```ts
export function requireEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}
```

---

# ✅ Smoke Tests post-déploiement

À exécuter manuellement après chaque phase déployée.

## Phase 0 smoke test (15 min)

1. Signup client normal → `users.role = 'client'`
2. Signup avec metadata `role:'admin'` → `users.role = 'client'` (pas admin)
3. Browser private + tenter `/admin` sans login → redirige vers login (sans bypass)
4. Curl POST `paymee-webhook` sans signature → 401
5. Curl POST `bid-accepted` sans `x-edge-secret` → 401
6. Créer un job, accepter un bid → status devient `'confirmed'` (pas erreur)
7. Faire un paiement Paymee sandbox → webhook valide signature, status devient `'paid'`
8. Bundle JS (`grep "22222222" .next/static/chunks/*.js`) → vide

## Phase 1 smoke test (30 min)

1. Wizard driver complet jusqu'à Step 4 → tous les fichiers uploadés
2. Page admin drivers → CIN/permis affichées (signed URLs marchent)
3. Créer 2 promos, en utiliser concurremment depuis 2 sessions → counts cohérents
4. Forcer 2 invocations de `job-completed` sur même job → 1 seul crédit
5. BidsList avec 5 bids → 1 query DB en Network tab
6. Refuser géoloc en tant que driver → message UI visible

---

# 🔄 Rollback Plan

Chaque migration SQL doit avoir son rollback documenté. Pour chaque fichier `supabase/00X_*.sql`, garder un fichier inverse dans `supabase/rollbacks/00X_*.down.sql`.

Exemple pour `004_status_pipeline.sql` :
```sql
-- supabase/rollbacks/004_status_pipeline.down.sql
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled', 'expired'));
```

Pour Edge Functions : déploiement via `supabase functions deploy <name>` → Supabase garde l'historique. `supabase functions deploy <name> --version <prev>` rollback.

Pour code Next.js : déploiement Vercel = rollback en 1 clic via dashboard.

---

# 📊 Tracking

| Phase | Tasks | Done | Status |
|---|---|---|---|
| 0 | 8 | 0/8 | 🔴 Not started |
| 1 | 6 | 0/6 | ⏸ Waiting Phase 0 |
| 2 | 5 | 0/5 | ⏸ Waiting Phase 1 |
| 3 | 6 | 0/6 | ⏸ Long-term |
| **Total** | **25** | **0/25** | |

**Last updated:** _(update this when you check tasks)_
