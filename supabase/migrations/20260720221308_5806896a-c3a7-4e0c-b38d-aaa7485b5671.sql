ALTER TABLE public.custom_events ADD COLUMN IF NOT EXISTS notified_1m BOOLEAN DEFAULT false NOT NULL;

DROP INDEX IF EXISTS custom_events_reminder_idx;

CREATE INDEX custom_events_reminder_idx ON public.custom_events (date, time, notified_10m, notified_30m, notified_1m);
