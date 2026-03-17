-- Schedule daily cleanup of stale push tokens at 3 AM UTC
SELECT cron.schedule(
  'cleanup-stale-tokens-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://gpgtzebpzbkcjtuffluo.supabase.co/functions/v1/cleanup-tokens',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ3R6ZWJwemJrY2p0dWZmbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODMwMzIsImV4cCI6MjA4MzM1OTAzMn0.K4RuWsbFMXyvnMn8M1O3j16tz_rkYCZZUBt5bWyrFWI"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule email reminders every minute
SELECT cron.schedule(
  'send-email-reminders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://gpgtzebpzbkcjtuffluo.supabase.co/functions/v1/send-email-reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ3R6ZWJwemJrY2p0dWZmbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODMwMzIsImV4cCI6MjA4MzM1OTAzMn0.K4RuWsbFMXyvnMn8M1O3j16tz_rkYCZZUBt5bWyrFWI"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);