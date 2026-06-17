alter table public.inspections
  add column if not exists pending_interventions text[] default '{}';
