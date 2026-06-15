-- 022_push_tokens_update_policy.sql
-- push_tokens already had own-row INSERT/SELECT/DELETE policies but no UPDATE
-- policy, so an upsert (INSERT ... ON CONFLICT (user_id, token) DO UPDATE) from
-- the mobile app failed on the update half. Add own-row UPDATE so the app can
-- re-register / reactivate its Expo push token.
DROP POLICY IF EXISTS "push_tokens_update" ON public.push_tokens;
CREATE POLICY "push_tokens_update" ON public.push_tokens
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
