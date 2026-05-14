create table if not exists public.apiary_species (
  apiary_id uuid not null references apiaries(id) on delete cascade,
  species_id text not null references phenology_species(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint apiary_species_pkey primary key (apiary_id, species_id)
);

alter table public.apiary_species enable row level security;

-- SELECT: chi può leggere l'apiario può leggere le sue specie
create policy "apiary_species_select"
  on public.apiary_species
  for select
  using (public.user_can_read_apiary(apiary_id));

-- INSERT: solo il proprietario dell'apiario
create policy "apiary_species_insert"
  on public.apiary_species
  for insert
  with check (
    exists (
      select 1 from apiaries
      where id = apiary_id and owner_id = auth.uid()
    )
  );

-- DELETE: solo il proprietario dell'apiario
create policy "apiary_species_delete"
  on public.apiary_species
  for delete
  using (
    exists (
      select 1 from apiaries
      where id = apiary_id and owner_id = auth.uid()
    )
  );
