
ALTER TABLE public.custom_events
  ADD COLUMN IF NOT EXISTS notified_30m boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_10m boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_custom_events_start_notify
  ON public.custom_events (
    ((date + COALESCE(time, '00:00:00'::time)) AT TIME ZONE 'Asia/Kolkata')
  )
  WHERE notified_30m = false OR notified_10m = false;
