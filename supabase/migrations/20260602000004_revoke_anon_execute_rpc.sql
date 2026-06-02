-- SECURITY DEFINER functions callable via RPC must not be executable by anon.
-- Revoke from PUBLIC (includes anon + authenticated), grant back to authenticated.

-- create_hive_with_queen: used by the app to create hives + first queen atomically
revoke execute on function public.create_hive_with_queen from public;
grant execute on function public.create_hive_with_queen to authenticated;

-- get_storage_usage: used by the statistics page
revoke execute on function public.get_storage_usage from public;
grant execute on function public.get_storage_usage to authenticated;

-- trigger_set_timestamp: only used by triggers, not via RPC — safe to revoke from public
revoke execute on function public.trigger_set_timestamp from public;

-- RLS helper functions: only used inside SQL policies, not via RPC
revoke execute on function public.user_can_read_apiary from public;
revoke execute on function public.user_can_write_apiary from public;
revoke execute on function public.user_owns_apiary from public;
revoke execute on function public.user_can_read_hive from public;
revoke execute on function public.user_can_write_hive from public;
revoke execute on function public.is_app_admin from public;

-- Storage helper functions: only used in storage bucket policies
revoke execute on function public.storage_get_apiary_id from public;
revoke execute on function public.storage_can_read_apiary_media from public;
revoke execute on function public.storage_can_write_apiary_media from public;
revoke execute on function public.storage_can_delete_apiary_media from public;
revoke execute on function public.storage_can_read_inspection_media from public;
revoke execute on function public.storage_can_write_inspection_media from public;
revoke execute on function public.storage_can_delete_inspection_media from public;
