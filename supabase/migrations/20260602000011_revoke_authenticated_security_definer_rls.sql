-- Revoke EXECUTE from authenticated for SECURITY DEFINER functions that are
-- used only internally (triggers, RLS policy helpers).
-- The caller is never a user via supabase.rpc().
--
-- KEPT as authenticated-executable (called via supabase.rpc() from the app):
--   create_hive_with_queen  — atomic create hive + queen
--   get_storage_usage       — statistics page
--   is_app_admin            — admin check in settings

-- Trigger-only functions
revoke execute on function public.handle_new_user from authenticated;
revoke execute on function public.trigger_set_timestamp from authenticated;

-- RLS helper functions (used only inside SQL policies, never via RPC)
revoke execute on function public.user_can_read_apiary from authenticated;
revoke execute on function public.user_can_write_apiary from authenticated;
revoke execute on function public.user_owns_apiary from authenticated;
revoke execute on function public.user_can_read_hive from authenticated;
revoke execute on function public.user_can_write_hive from authenticated;

-- Storage helper functions (used only in storage bucket policies)
revoke execute on function public.storage_can_read_apiary_media from authenticated;
revoke execute on function public.storage_can_write_apiary_media from authenticated;
revoke execute on function public.storage_can_delete_apiary_media from authenticated;
revoke execute on function public.storage_can_read_hive_media from authenticated;
revoke execute on function public.storage_can_write_hive_media from authenticated;
revoke execute on function public.storage_can_delete_hive_media from authenticated;
revoke execute on function public.storage_can_read_inspection_media from authenticated;
revoke execute on function public.storage_can_write_inspection_media from authenticated;
revoke execute on function public.storage_can_delete_inspection_media from authenticated;
