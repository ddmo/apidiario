-- DB size function for admin dashboard (free tier limit: 500 MB)
create or replace function public.get_db_size()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database())
$$;

revoke execute on function public.get_db_size from public, anon, authenticated;
grant execute on function public.get_db_size to authenticated;

-- Auth user count (approximation for MAUs, free limit: 50,000)
create or replace function public.get_auth_user_count()
returns bigint
language sql
security definer
set search_path = auth, public
as $$
  select count(*) from auth.users
$$;

revoke execute on function public.get_auth_user_count from public, anon, authenticated;
grant execute on function public.get_auth_user_count to authenticated;
