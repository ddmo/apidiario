-- Fix activity_log INSERT RLS: allow authenticated users to insert only own logs
drop policy if exists "service can insert logs" on public.activity_log;

create policy "authenticated can insert own logs"
  on public.activity_log
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));
