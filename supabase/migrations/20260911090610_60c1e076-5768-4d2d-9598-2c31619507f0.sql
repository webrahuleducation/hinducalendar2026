
TRUNCATE TABLE net._http_response;
TRUNCATE TABLE cron.job_run_details;

SELECT cron.schedule(
  'purge-net-http-response-hourly',
  '7 * * * *',
  $$DELETE FROM net._http_response WHERE created < now() - interval '2 days'$$
);

SELECT cron.schedule(
  'purge-cron-job-run-details-daily',
  '17 4 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days'$$
);
