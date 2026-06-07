-- ═══════════════════════════════════════════════════════════════
-- VanZ — Audit Logs Table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('job', 'bid', 'user')),
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  previous_state text,
  new_state text,
  payload jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "admin_all_audit_logs" ON public.audit_logs;

-- Policy: Only Admins can view audit logs
CREATE POLICY "admin_all_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Create index for search speed optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- Ensure delivery photo location columns exist on jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS delivery_photo_lat numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS delivery_photo_lng numeric;
