-- RPC per ottenere dimensione totale storage bucket
-- Solo admin puo' chiamarlo (SECURITY DEFINER bypassa RLS)

create or replace function get_storage_usage(bucket_name text)
returns table (
  total_size bigint,
  total_files bigint
)
language plpgsql security definer
as $$
begin
  return query
  select
    coalesce(sum((metadata->>'size')::bigint), 0) as total_size,
    count(*)::bigint as total_files
  from storage.objects
  where bucket_id = bucket_name;
end;
$$;
