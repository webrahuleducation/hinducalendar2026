
-- 1. Composite index for reminder scan
CREATE INDEX IF NOT EXISTS idx_custom_events_reminder_scan
  ON public.custom_events (reminder_enabled, reminder_sent, date)
  WHERE reminder_enabled = true AND reminder_sent = false;

-- 2. Atomic claim RPC — flips reminder_sent = true and returns the claimed rows
CREATE OR REPLACE FUNCTION public.claim_due_custom_reminders(_limit int DEFAULT 100)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  date date,
  "time" time,
  reminder_time text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT r.id
    FROM public.ready_custom_reminders r
    WHERE r.trigger_at <= now()
    ORDER BY r.trigger_at ASC
    LIMIT _limit
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.custom_events ce
    SET reminder_sent = true,
        updated_at = now()
    FROM due
    WHERE ce.id = due.id
    RETURNING ce.id, ce.user_id, ce.title, ce.description, ce.date, ce.time, ce.reminder_time
  )
  SELECT * FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_due_custom_reminders(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_due_custom_reminders(int) TO service_role;

-- 3. Weekly cleanup of old sent reminders (older than 6 months)
CREATE OR REPLACE FUNCTION public.cleanup_expired_custom_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH del AS (
    DELETE FROM public.custom_events
    WHERE reminder_sent = true
      AND date < (CURRENT_DATE - INTERVAL '6 months')
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM del;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_custom_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_custom_events() TO service_role;

-- 4. Reschedule cron jobs with timeout guards
DO $$
BEGIN
  PERFORM cron.unschedule('send-appilix-reminders-every-10-min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('clean-expired-reminders-weekly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Every 10 minutes: async HTTP with a 5-minute timeout so a stalled call cannot overlap the next tick
SELECT cron.schedule(
  'send-appilix-reminders-every-10-min',
  '*/10 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://gpgtzebpzbkcjtuffluo.supabase.co/functions/v1/send-appilix-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ3R6ZWJwemJrY2p0dWZmbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODMwMzIsImV4cCI6MjA4MzM1OTAzMn0.K4RuWsbFMXyvnMn8M1O3j16tz_rkYCZZUBt5bWyrFWI'
    ),
    body := jsonb_build_object('scheduled_at', now()),
    timeout_milliseconds := 300000
  );
  $cron$
);

-- Sunday 02:00 UTC: purge sent reminders older than 6 months
SELECT cron.schedule(
  'clean-expired-reminders-weekly',
  '0 2 * * 0',
  $cron$ SELECT public.cleanup_expired_custom_events(); $cron$
);
