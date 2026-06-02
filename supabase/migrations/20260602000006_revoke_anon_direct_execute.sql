-- Supabase grants EXECUTE directly to anon for all functions by default.
-- Revoke from anon for SECURITY DEFINER functions not meant for public.
-- authenticated retains EXECUTE for functions called via supabase.rpc().

-- App RPC functions (called via supabase.rpc())
revoke execute on function public.create_hive_with_queen from anon;
revoke execute on function public.get_storage_usage from anon;

-- trigger & internal functions
revoke execute on function public.trigger_set_timestamp from anon;
revoke execute on function public.handle_new_user from anon;

-- RLS helper functions
revoke execute on function public.user_can_read_apiary from anon;
revoke execute on function public.user_can_write_apiary from anon;
revoke execute on function public.user_owns_apiary from anon;
revoke execute on function public.user_can_read_hive from anon;
revoke execute on function public.user_can_write_hive from anon;
revoke execute on function public.is_app_admin from anon;

-- Storage helper functions
revoke execute on function public.storage_get_apiary_id from anon;
revoke execute on function public.storage_can_read_apiary_media from anon;
revoke execute on function public.storage_can_write_apiary_media from anon;
revoke execute on function public.storage_can_delete_apiary_media from anon;
revoke execute on function public.storage_can_read_inspection_media from anon;
revoke execute on function public.storage_can_write_inspection_media from anon;
revoke execute on function public.storage_can_delete_inspection_media from anon;
