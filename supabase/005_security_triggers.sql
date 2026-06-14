-- Patch: handle_new_user defaults to 'client' but can accept 'driver' safely.
-- Promotion to admin happens via separate admin SQL.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
BEGIN
  -- Only allow 'client' or 'driver'. Default to 'client' if anything else is requested.
  IF requested_role NOT IN ('client', 'driver') THEN
    requested_role := 'client';
  END IF;

  INSERT INTO public.users (id, phone, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'VanZ'),
    requested_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
