-- VanZ Global App Schema
-- 21 core tables + 1 Required `Auctions` table

-- 0. `Auctions` table (MANDATORY RULE)
CREATE TABLE IF NOT EXISTS public."Auctions" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  starting_price numeric(10,2) DEFAULT currenC_setting('app.settings.currency', true)::numeric,
  is_deleted boolean DEFAULT false, -- Rule: never drop, soft delete only
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We configure the rest of the VanZ schema below.

-- Enable Row Level Security (RLS) as a best practice on everything.
-- We will write the specific RLS policies in a later phase, for now we just create the schema.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  city text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'driver', 'admin')),
  referral_code text UNIQUE,
  referred_by uuid REFERENCES public.users(id),
  credit_balance numeric(10,2) DEFAULT 0,
  loyalty_points integer DEFAULT 0,
  is_online boolean DEFAULT false,
  last_online_at timestamp with time zone,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
  account_type text DEFAULT 'personal',
  terms_accepted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drivers Table (Extension of Users)
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  cin_number text UNIQUE NOT NULL,
  cin_expiry date NOT NULL,
  date_of_birth date NOT NULL,
  vehicle_type text NOT NULL,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_color text,
  vehicle_plate text UNIQUE NOT NULL,
  vehicle_capacity numeric(10,2),
  doc_carte_grise text,
  doc_assurance text,
  doc_permis text,
  doc_visite_technique text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.users(id) NOT NULL,
  service_type text NOT NULL,
  pickup_address text NOT NULL,
  pickup_lat numeric(10,8),
  pickup_lng numeric(11,8),
  dropoff_address text NOT NULL,
  dropoff_lat numeric(10,8),
  dropoff_lng numeric(11,8),
  description text,
  photo_urls text[],
  stops jsonb,
  load_capacity text,
  client_budget numeric(10,2),
  preferred_time text,
  payment_method text DEFAULT 'cash',
  scheduled_at timestamp with time zone,
  time_slot text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled', 'expired')),
  accepted_bid_id uuid, -- Will be a foreign key to bids table, created after bids table
  commission_rate numeric(5,2) DEFAULT 0.15,
  commission_amount numeric(10,2),
  driver_payout numeric(10,2),
  paymee_ref text,
  insurance_selected boolean DEFAULT false,
  delivery_photo_url text,
  receipt_url text,
  cancelled_by uuid REFERENCES public.users(id),
  cancel_reason text,
  cancel_fee numeric(10,2),
  cancelled_at timestamp with time zone,
  preferred_driver_id uuid REFERENCES public.drivers(id),
  is_return_trip boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bids Table
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  note text,
  estimated_duration_minutes integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(job_id, driver_id)
);

-- Add foreign key back to jobs now that bids exists
ALTER TABLE public.jobs ADD CONSTRAINT fk_jobs_accepted_bid FOREIGN KEY (accepted_bid_id) REFERENCES public.bids(id);

-- 5. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) NOT NULL,
  client_id uuid REFERENCES public.users(id) NOT NULL,
  phase text DEFAULT 'pre_bid' CHECK (phase IN ('pre_bid', 'post_acceptance', 'archived')),
  violation_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(job_id, driver_id)
);

-- 6. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id), -- Nullable for system
  sender_type text CHECK (sender_type IN ('client', 'driver', 'system')),
  type text DEFAULT 'text' CHECK (type IN ('text', 'voice', 'photo', 'location', 'system')),
  content text NOT NULL,
  media_url text,
  media_duration integer,
  location_lat numeric(10,8),
  location_lng numeric(11,8),
  location_label text,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_msgs_conv ON public.messages(conversation_id, created_at);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) NOT NULL,
  reviewer_id uuid REFERENCES public.users(id) NOT NULL,
  reviewee_id uuid REFERENCES public.users(id) NOT NULL,
  reviewer_type text CHECK (reviewer_type IN ('client', 'driver')),
  stars integer CHECK (stars >= 1 AND stars <= 5),
  comment text,
  tags text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(job_id, reviewer_id)
);

-- 8. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES public.users(id) NOT NULL,
  referred_id uuid REFERENCES public.users(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded')),
  rewarded_at timestamp with time zone,
  job_id uuid REFERENCES public.jobs(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- 9. Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) NOT NULL,
  opened_by uuid REFERENCES public.users(id) NOT NULL,
  opened_type text CHECK (opened_type IN ('client', 'driver')),
  reason text NOT NULL,
  description text NOT NULL,
  photo_urls text[],
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  resolution text CHECK (resolution IN ('refund', 'deduct', 'dismiss', 'warn', 'suspend')),
  resolved_by uuid REFERENCES public.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Driver Locations Table
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id),
  lat numeric(10,8) NOT NULL,
  lng numeric(11,8) NOT NULL,
  heading numeric(5,2),
  speed numeric(5,2),
  accuracy numeric(8,2),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 50),
  method text NOT NULL CHECK (method IN ('bank', 'flouci', 'postepay')),
  account_ref text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_type text CHECK (discount_type IN ('fixed', 'percent')),
  discount_value numeric(10,2) NOT NULL,
  max_uses integer,
  uses_per_user integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  min_job_amount numeric(10,2) DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text CHECK (type IN ('credit', 'debit', 'promo', 'referral', 'refund')),
  job_id uuid REFERENCES public.jobs(id),
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  points integer NOT NULL,
  type text CHECK (type IN ('earned', 'redeemed', 'bonus')),
  job_id uuid REFERENCES public.jobs(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Push Tokens Table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, token)
);

-- 17. Saved Addresses Table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  label text NOT NULL,
  address text NOT NULL,
  lat numeric(10,8),
  lng numeric(11,8),
  floor text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Favorite Drivers Table
CREATE TABLE IF NOT EXISTS public.favorite_drivers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.users(id) NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, driver_id)
);

-- 19. SOS Events Table
CREATE TABLE IF NOT EXISTS public.sos_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  user_type text CHECK (user_type IN ('client', 'driver')),
  lat numeric(10,8) NOT NULL,
  lng numeric(11,8) NOT NULL,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.users(id) NOT NULL,
  reported_id uuid REFERENCES public.users(id) NOT NULL,
  job_id uuid REFERENCES public.jobs(id),
  reason text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'action_taken', 'dismissed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. Admin Actions Table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.users(id) NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  metadata jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helper Triggers: Update `updated_at` automatically where necessary
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_driver_locations_updated_at 
BEFORE UPDATE ON public.driver_locations 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Auto-conversation Trigger on Bid Insert
CREATE OR REPLACE FUNCTION on_bid_created()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_conversation_id uuid;
BEGIN
  -- Fetch the client_id from the related job
  SELECT client_id INTO v_client_id FROM public.jobs WHERE id = NEW.job_id;

  -- Create conversation if doesn't exist
  INSERT INTO public.conversations (job_id, driver_id, client_id, phase)
  VALUES (NEW.job_id, NEW.driver_id, v_client_id, 'pre_bid')
  ON CONFLICT (job_id, driver_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- If conversation was just created, v_conversation_id will be NOT NULL
  -- If DO NOTHING caught it, it will be NULL, so we manually fetch it
  IF v_conversation_id IS NULL THEN
     SELECT id INTO v_conversation_id FROM public.conversations 
     WHERE job_id = NEW.job_id AND driver_id = NEW.driver_id;
  END IF;

  -- Inject initial system message
  INSERT INTO public.messages (conversation_id, sender_type, type, content)
  VALUES (v_conversation_id, 'system', 'system', 'Offre reçue — vous pouvez poser des questions avant d''accepter');

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_bid_insert_create_conversation
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE PROCEDURE on_bid_created();

-- Phase 2.7 & 2.8 & 2.9 Alterations
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cached_rating numeric(3,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_commission_debt integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, token)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Phase 3.1 & 3.2 Alterations
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.admin_users(id),
  action text NOT NULL,
  data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION get_gmv_today()
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(accepted_bid_amount), 0)::INTEGER
  FROM jobs
  WHERE status = 'completed'
  AND DATE(updated_at) = CURRENT_DATE
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION check_auto_suspend()
RETURNS TRIGGER AS $$
DECLARE report_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE reported_id = NEW.reported_id
  AND created_at > NOW() - INTERVAL '30 days'
  AND status = 'pending';

  IF report_count >= 3 THEN
    UPDATE users SET account_status = 'suspended',
      suspended_until = NOW() + INTERVAL '7 days'
    WHERE id = NEW.reported_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_suspend_on_reports
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION check_auto_suspend();

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS review_prompted_at timestamp with time zone;

-- Driver public rating Computed View Cache
CREATE OR REPLACE VIEW public.driver_ratings AS
SELECT
  reviewee_id as driver_id,
  ROUND(AVG(stars)::numeric, 1) as rating,
  COUNT(*) as total_reviews
FROM public.reviews
WHERE reviewer_type = 'client'
GROUP BY reviewee_id;
