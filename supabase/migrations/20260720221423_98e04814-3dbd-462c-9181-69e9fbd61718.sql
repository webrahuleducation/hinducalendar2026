REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_custom_events() FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_due_custom_reminders(integer) FROM public, authenticated;
