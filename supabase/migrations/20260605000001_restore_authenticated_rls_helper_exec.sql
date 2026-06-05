-- Ripristina EXECUTE per authenticated sulle funzioni SECURITY DEFINER
-- usate dalle RLS policy (sia table RLS che storage bucket RLS).
--
-- La migration 20260602000011 ha revocato erroneamente authenticated,
-- causando "permission denied for function" quando le policy RLS
-- valutano queste funzioni per un utente autenticato.
--
-- Trigger-only (handle_new_user, trigger_set_timestamp) rimangono
-- revocate — i trigger girano come owner della tabella, non come authenticated.

-- RLS helper functions
grant execute on function public.user_can_read_apiary to authenticated;
grant execute on function public.user_can_write_apiary to authenticated;
grant execute on function public.user_owns_apiary to authenticated;
grant execute on function public.user_can_read_hive to authenticated;
grant execute on function public.user_can_write_hive to authenticated;

-- Storage helper functions
grant execute on function public.storage_can_read_apiary_media to authenticated;
grant execute on function public.storage_can_write_apiary_media to authenticated;
grant execute on function public.storage_can_delete_apiary_media to authenticated;
grant execute on function public.storage_can_read_hive_media to authenticated;
grant execute on function public.storage_can_write_hive_media to authenticated;
grant execute on function public.storage_can_delete_hive_media to authenticated;
grant execute on function public.storage_can_read_inspection_media to authenticated;
grant execute on function public.storage_can_write_inspection_media to authenticated;
grant execute on function public.storage_can_delete_inspection_media to authenticated;
