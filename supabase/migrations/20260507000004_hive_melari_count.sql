alter table public.hives
  add column melari_count smallint not null default 0
    check (melari_count between 0 and 10);
