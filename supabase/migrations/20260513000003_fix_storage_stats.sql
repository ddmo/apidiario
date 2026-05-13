-- Fix: SUM(bigint) returns numeric, need explicit ::bigint cast
create or replace function public.get_storage_usage(bucket_name text)
returns table (total_size bigint, total_files bigint)
language plpgsql security definer
set search_path = ''
as $$
begin
  return query
  select
    coalesce(sum((metadata->>'size')::bigint), 0)::bigint as total_size,
    count(*)::bigint as total_files
  from storage.objects
  where bucket_id = bucket_name;
end;
$$;
