-- Owner apiario può cancellare qualsiasi ispezione
-- Editor può cancellare solo le proprie

drop policy if exists inspections_delete on public.inspections;

create policy inspections_delete on public.inspections
  for delete using (
    -- Owner dell'apiario: può cancellare qualsiasi ispezione
    exists (
      select 1 from hives h
      join apiaries a on a.id = h.apiary_id
      where h.id = inspections.hive_id
        and a.owner_id = auth.uid()
    )
    or (
      -- Editor: solo le proprie ispezioni, con accesso in scrittura
      performed_by = auth.uid()
      and public.user_can_write_hive(hive_id)
    )
  );
