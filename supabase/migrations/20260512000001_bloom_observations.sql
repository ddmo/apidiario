create table bloom_observations (
  id uuid not null default gen_random_uuid(),
  apiary_id uuid not null references apiaries(id) on delete cascade,
  species_id text not null references phenology_species(id) on delete cascade,
  year integer not null,
  observed_start_date date,
  observed_end_date date,
  notes text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bloom_observations_pkey primary key (id),
  constraint bloom_observations_unique unique (apiary_id, species_id, year)
);

alter table bloom_observations enable row level security;

create policy "users can read own observations"
  on bloom_observations
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from apiary_access
      where apiary_access.apiary_id = bloom_observations.apiary_id
      and apiary_access.user_id = auth.uid()
    )
  );

create policy "users can insert own observations"
  on bloom_observations
  for insert
  with check (user_id = auth.uid());

create policy "users can update own observations"
  on bloom_observations
  for update
  using (user_id = auth.uid());

create policy "users can delete own observations"
  on bloom_observations
  for delete
  using (user_id = auth.uid());

create index idx_bloom_observations_apiary_species_year
  on bloom_observations (apiary_id, species_id, year);
