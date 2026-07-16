
REVOKE EXECUTE ON FUNCTION public.claim_due_custom_reminders(int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_custom_events() FROM PUBLIC, anon, authenticated;
