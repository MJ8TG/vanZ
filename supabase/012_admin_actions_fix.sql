-- 012_admin_actions_fix.sql
-- Fix duplicate admin_actions table definition.
-- The original had admin_id as text with no FK.
-- This recreates it with proper uuid FK to admin_users.

-- Drop and recreate with correct types
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

-- Performance index
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON public.admin_actions(admin_id, created_at DESC);
