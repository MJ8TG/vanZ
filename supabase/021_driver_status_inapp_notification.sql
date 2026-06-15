-- 021_driver_status_inapp_notification.sql
-- Create an in-app notification (notifications table) when a driver is approved
-- or rejected, in addition to the existing SMS + push sent by the
-- driver-status-change edge function. The mobile Notifications screen reads this
-- table (with a realtime subscription), so the driver sees it instantly in-app.
--
-- This extends the existing notify_driver_status_change() trigger function so no
-- edge-function redeploy is needed, and the in-app notification fires even if
-- Twilio/push are not configured.

CREATE OR REPLACE FUNCTION public.notify_driver_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status != OLD.status AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
    -- In-app notification for the driver (read by the mobile Notifications screen).
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.id,
      CASE WHEN NEW.status = 'approved' THEN 'driver_approved' ELSE 'driver_rejected' END,
      CASE WHEN NEW.status = 'approved' THEN 'Compte activé' ELSE 'Dossier rejeté' END,
      CASE
        WHEN NEW.status = 'approved'
          THEN 'Felicitations ! Votre compte chauffeur VanZ est active. Vous pouvez desormais recevoir des missions.'
        ELSE 'Votre dossier a ete rejete. Raison : ' || COALESCE(NEW.rejection_reason, 'Non specifiee')
             || '. Vous pouvez resoumettre vos documents.'
      END,
      jsonb_build_object('status', NEW.status, 'driver_id', NEW.id)
    );

    -- Existing: notify the edge function (SMS + push).
    PERFORM net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/driver-status-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('type', 'UPDATE', 'table', 'drivers', 'record', row_to_json(NEW), 'old_record', row_to_json(OLD))
    );
  END IF;
  RETURN NEW;
END;
$function$;
