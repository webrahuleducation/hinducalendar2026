-- Helper view: only reminders that are enabled, not sent, with a computed trigger time
CREATE OR REPLACE VIEW public.ready_custom_reminders AS
SELECT
  ce.id,
  ce.user_id,
  ce.title,
  ce.description,
  ce.date,
  ce.time,
  ce.reminder_time,
  ce.reminder_enabled,
  ce.reminder_sent,
  -- Combine date + time (default 09:00) as IST, convert to UTC
  ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata') AS event_at,
  -- Trigger offset from event time
  CASE ce.reminder_time
    WHEN 'same_day'      THEN ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata')
    WHEN '1_day_before'  THEN ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata') - INTERVAL '1 day'
    WHEN '2_days_before' THEN ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata') - INTERVAL '2 days'
    WHEN '1_week_before' THEN ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata') - INTERVAL '7 days'
    ELSE ((ce.date::text || ' ' || COALESCE(ce.time::text, '09:00:00'))::timestamp AT TIME ZONE 'Asia/Kolkata') - INTERVAL '1 day'
  END AS trigger_at
FROM public.custom_events ce
WHERE ce.reminder_enabled = true
  AND ce.reminder_sent = false;

-- Backend-only read access
GRANT SELECT ON public.ready_custom_reminders TO service_role;