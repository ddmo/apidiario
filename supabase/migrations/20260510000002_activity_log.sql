create table activity_log (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  created_at timestamptz not null default now(),

  constraint activity_log_pkey primary key (id)
);

alter table activity_log enable row level security;

create policy "admins can read all logs"
  on activity_log
  for select
  using (is_app_admin());

create policy "service can insert logs"
  on activity_log
  for insert
  with check (true);

create index activity_log_created_at_idx on activity_log (created_at desc);
