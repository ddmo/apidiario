alter table public.phenology_species enable row level security;

-- Reference table: any authenticated user can read species list
create policy "phenology_species_select"
  on public.phenology_species
  for select
  to authenticated
  using (true);
