select
cron.schedule(
  'process-reminders-every-5-min',
  '*/5 * * * *',
  $$
  select
    net.http_post(
        url:='https://gpgtzebpzbkcjtuffluo.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ3R6ZWJwemJrY2p0dWZmbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODMwMzIsImV4cCI6MjA4MzM1OTAzMn0.K4RuWsbFMXyvnMn8M1O3j16tz_rkYCZZUBt5bWyrFWI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);