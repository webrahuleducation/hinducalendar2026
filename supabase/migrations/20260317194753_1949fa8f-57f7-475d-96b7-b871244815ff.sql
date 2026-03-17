-- Add reminder_sent column to custom_events for email reminder tracking
ALTER TABLE public.custom_events ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Create index for efficient email reminder queries
CREATE INDEX IF NOT EXISTS idx_custom_events_reminder_query 
ON public.custom_events (date, reminder_enabled, reminder_sent) 
WHERE reminder_enabled = true AND reminder_sent = false;