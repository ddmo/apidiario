create table public.user_inspection_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  express_fields jsonb not null default '["queen","hasBrood","population","notes"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_inspection_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_inspection_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on public.user_inspection_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_inspection_preferences for update
  using (auth.uid() = user_id);
