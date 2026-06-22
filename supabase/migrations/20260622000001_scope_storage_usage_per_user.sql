-- get_storage_usage era platform-wide (somma di tutto il bucket, nessun filtro
-- utente) — visibile a chiunque, non solo per i propri dati. Lo scopiamo ai
-- file di apiari/arnie/ispezioni a cui l'utente corrente ha accesso, seguendo
-- le stesse convenzioni di path già usate dalle policy RLS dello storage
-- (apiaries/{id}/..., hives/{id}/..., inspections/{id}/...).

create or replace function public.get_storage_usage(bucket_name text)
returns table (total_size bigint, total_files bigint)
language plpgsql security definer
set search_path = ''
as $$
declare
  my_apiary_ids uuid[];
  my_hive_ids uuid[];
  my_inspection_ids uuid[];
begin
  select coalesce(array_agg(a.id), '{}') into my_apiary_ids
  from public.apiaries a
  where a.owner_id = auth.uid()
     or exists (
       select 1 from public.apiary_access aa
       where aa.apiary_id = a.id and aa.user_id = auth.uid()
     );

  select coalesce(array_agg(h.id), '{}') into my_hive_ids
  from public.hives h
  where h.apiary_id = any(my_apiary_ids);

  select coalesce(array_agg(i.id), '{}') into my_inspection_ids
  from public.inspections i
  where i.hive_id = any(my_hive_ids);

  return query
  select
    coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint as total_size,
    count(*)::bigint as total_files
  from storage.objects o
  where o.bucket_id = bucket_name
    and (
      ((string_to_array(o.name, '/'))[1] = 'apiaries'
        and (string_to_array(o.name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and ((string_to_array(o.name, '/'))[2])::uuid = any(my_apiary_ids))
      or ((string_to_array(o.name, '/'))[1] = 'hives'
        and (string_to_array(o.name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and ((string_to_array(o.name, '/'))[2])::uuid = any(my_hive_ids))
      or ((string_to_array(o.name, '/'))[1] = 'inspections'
        and (string_to_array(o.name, '/'))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and ((string_to_array(o.name, '/'))[2])::uuid = any(my_inspection_ids))
    );
end;
$$;
