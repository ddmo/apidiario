alter table public.hives
  add column has_apiscampo    boolean not null default false,
  add column has_propolis_net boolean not null default false;
