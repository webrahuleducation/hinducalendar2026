ALTER TABLE public.event_reminders
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS notified_d2 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_d1 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_d0 boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_reminders_scan
  ON public.event_reminders (event_date)
  WHERE reminder_enabled = true;
