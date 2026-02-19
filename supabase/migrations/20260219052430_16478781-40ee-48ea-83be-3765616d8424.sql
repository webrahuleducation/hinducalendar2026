-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add reminder_sent column to event_reminders to prevent duplicate sends
ALTER TABLE public.event_reminders
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Add reminder_send_at column to know when to send the reminder
ALTER TABLE public.event_reminders
ADD COLUMN IF NOT EXISTS reminder_send_at TIMESTAMPTZ;