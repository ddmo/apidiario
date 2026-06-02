-- Revoke EXECUTE from anon for SECURITY DEFINER functions.
-- This prevents unauthenticated calls via /rest/v1/rpc/... while keeping
-- the functions usable by triggers, internal RLS policy checks, and
-- authenticated supabase.rpc() calls.

-- handle_new_user: trigger function called by auth.users INSERT.
--   Must stay SECURITY DEFINER to insert into profiles before session is established.
--   Should NOT be callable via RPC — anon must be revoked.
revoke execute on function public.handle_new_user from anon, public;

-- Hive media storage helpers (added in 20260602000008)
revoke execute on function public.storage_can_read_hive_media from anon, public;
revoke execute on function public.storage_can_write_hive_media from anon, public;
revoke execute on function public.storage_can_delete_hive_media from anon, public;
