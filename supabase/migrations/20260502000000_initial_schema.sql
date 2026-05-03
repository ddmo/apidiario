-- =====================================================================
-- Apidiario — Schema PostgreSQL per Supabase
-- =====================================================================
-- Versione:  0.1
-- Target:    Supabase (PostgreSQL 15)
-- Convenz.:  snake_case, UUID PK, RLS-first, soft-delete dove sensato
-- Encoding:  UTF-8
--
-- Questo file è pensato per essere eseguito una sola volta come
-- migrazione iniziale. Le evoluzioni successive andranno in file
-- separati dentro /supabase/migrations.
-- =====================================================================


-- =====================================================================
-- 1. ESTENSIONI
-- =====================================================================

-- pgcrypto: per gen_random_uuid() (in realtà PG 13+ lo ha nativo,
-- ma su Supabase è abilitato di default tramite questa estensione).
create extension if not exists "pgcrypto";


-- =====================================================================
-- 2. ENUM
-- =====================================================================
-- Scelgo enum nativi per i valori stabili. Per cose che potrebbero
-- crescere nel tempo (tipi di miele, prodotti antivarroa) uso TEXT
-- con CHECK constraint, così aggiungere un valore non richiede una
-- migrazione di tipo.

create type access_role as enum ('reader', 'editor');

create type hive_status as enum (
  'attiva',
  'sciamata',
  'morta',
  'riunita',
  'venduta',
  'ceduta'
);

create type hive_type as enum (
  'dadant_blatt',
  'langstroth',
  'top_bar',
  'altro'
);

create type bee_race as enum (
  'ligustica',
  'buckfast',
  'carnica',
  'sicula',
  'ibrida',
  'sconosciuta'
);

create type queen_origin as enum (
  'figlia',
  'introdotta',
  'sciamatura',
  'sostituzione_spontanea',
  'sconosciuta'
);

create type queen_marking_color as enum (
  'bianco',  -- anni terminanti con 1 o 6
  'giallo',  -- anni terminanti con 2 o 7
  'rosso',   -- anni terminanti con 3 o 8
  'verde',   -- anni terminanti con 4 o 9
  'blu',     -- anni terminanti con 5 o 0
  'non_marcata'
);

create type queen_seen_state as enum (
  'vista',
  'non_vista',
  'non_cercata'
);

create type population_strength as enum (
  'debole',
  'media',
  'forte'
);

create type behavior_type as enum (
  'calmo',
  'nervoso',
  'aggressivo'
);

create type queen_cells_type as enum (
  'nessuna',
  'scorta',         -- celle di scorta o di emergenza
  'sciamatura',     -- segno di sciamatura imminente
  'sostituzione'    -- regina vecchia o malata
);

create type pathology as enum (
  'varroa',
  'peste_americana',
  'peste_europea',
  'covata_calcificata',
  'nosema',
  'virus',
  'altro'
);

create type varroa_count_method as enum (
  'caduta_naturale',
  'lavaggio_alcol',
  'zucchero_velo',
  'altro'
);

create type media_kind as enum (
  'photo',
  'video'
);

create type reminder_recurrence as enum (
  'none',
  'weekly',
  'monthly',
  'yearly'
);

create type reminder_scope as enum (
  'global',  -- promemoria personale non legato a risorse
  'apiary',
  'hive'
);


-- =====================================================================
-- 3. FUNZIONI HELPER PER I TRIGGER
-- =====================================================================

-- Aggiorna automaticamente updated_at a ogni UPDATE.
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =====================================================================
-- 4. PROFILI UTENTE
-- =====================================================================
-- auth.users è gestita da Supabase Auth e non si tocca.
-- profiles estende auth.users con dati visibili agli altri membri
-- (display name) e si crea automaticamente alla registrazione.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Profilo applicativo dell''utente. Una riga per ogni auth.users.';

-- Trigger: crea automaticamente il profilo alla registrazione,
-- usando l''email come display_name iniziale (l''utente potrà cambiarlo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_timestamp
  before update on public.profiles
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 5. APIARI
-- =====================================================================

create table public.apiaries (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles(id) on delete restrict,
  name               text not null check (length(name) between 1 and 100),
  -- posizione opzionale: alcuni apicoltori non vogliono salvarla
  latitude           numeric(9, 6) check (latitude  between -90  and  90),
  longitude          numeric(9, 6) check (longitude between -180 and 180),
  address            text,
  bda_codice_aziendale text,  -- codice azienda apistica (BDA)
  notes              text,
  archived_at        timestamptz,  -- soft delete
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.apiaries is
  'Apiari posseduti dagli utenti. Soft-delete via archived_at.';

create trigger apiaries_set_timestamp
  before update on public.apiaries
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 6. CONDIVISIONI APIARIO
-- =====================================================================

create table public.apiary_access (
  apiary_id  uuid not null references public.apiaries(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       access_role not null,
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (apiary_id, user_id)
);

comment on table public.apiary_access is
  'Accessi su un intero apiario. L''owner non compare qui: è gestito '
  'dal campo apiaries.owner_id.';


-- =====================================================================
-- 7. INVITI APIARIO (utenti non ancora registrati)
-- =====================================================================

create table public.apiary_invites (
  id          uuid primary key default gen_random_uuid(),
  apiary_id   uuid not null references public.apiaries(id) on delete cascade,
  email       text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role        access_role not null,
  invited_by  uuid not null references public.profiles(id),
  token       uuid not null default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  unique (apiary_id, email)
);

comment on table public.apiary_invites is
  'Inviti pendenti per email. Quando l''utente si registra con la '
  'stessa email, una funzione converte l''invito in apiary_access.';


-- =====================================================================
-- 8. ARNIE
-- =====================================================================

create table public.hives (
  id                  uuid primary key default gen_random_uuid(),
  apiary_id           uuid not null references public.apiaries(id) on delete restrict,
  -- identificativo testuale, univoco DENTRO l''apiario
  identifier          text not null check (length(identifier) between 1 and 50),
  hive_type           hive_type not null default 'dadant_blatt',
  bee_race            bee_race not null default 'sconosciuta',
  status              hive_status not null default 'attiva',
  installed_on        date,
  origin_notes        text,  -- es: "sciame catturato 2024-04-12 in giardino vicino"
  nido_frame_count    smallint not null default 10
                       check (nido_frame_count between 1 and 30),
  notes               text,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (apiary_id, identifier)
);

comment on table public.hives is
  'Arnie. L''identifier (es. "A1", "12") è univoco solo all''interno '
  'dell''apiario di appartenenza.';

create trigger hives_set_timestamp
  before update on public.hives
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 9. CONDIVISIONI ARNIA (granulare)
-- =====================================================================

create table public.hive_access (
  hive_id    uuid not null references public.hives(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       access_role not null,
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (hive_id, user_id)
);

comment on table public.hive_access is
  'Accesso a una singola arnia. Si somma agli accessi via apiary_access.';


-- =====================================================================
-- 10. STORIA REGINE
-- =====================================================================

create table public.queens (
  id              uuid primary key default gen_random_uuid(),
  hive_id         uuid not null references public.hives(id) on delete cascade,
  birth_year      smallint check (birth_year between 1990 and 2100),
  marking_color   queen_marking_color not null default 'non_marcata',
  origin          queen_origin not null default 'sconosciuta',
  start_date      date not null default current_date,
  end_date        date,  -- null = regina attuale
  end_reason      text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

comment on table public.queens is
  'Storia delle regine di ciascuna arnia. La regina attuale ha end_date NULL.';

-- Vincolo: una sola regina attiva per arnia.
create unique index queens_one_active_per_hive
  on public.queens (hive_id)
  where end_date is null;

create trigger queens_set_timestamp
  before update on public.queens
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 11. ISPEZIONI
-- =====================================================================

create table public.inspections (
  id                    uuid primary key default gen_random_uuid(),
  hive_id               uuid not null references public.hives(id) on delete cascade,
  performed_at          timestamptz not null default now(),
  performed_by          uuid not null references public.profiles(id),

  -- meteo (auto da API se disponibile, altrimenti manuale)
  weather_summary       text,
  temperature_c         numeric(4, 1),

  -- regina e covata
  queen_seen            queen_seen_state not null default 'non_cercata',
  brood_eggs            boolean,
  brood_larvae          boolean,
  brood_capped          boolean,
  brood_frame_count     smallint check (brood_frame_count between 0 and 30),

  -- scorte e popolazione
  honey_frame_count     smallint check (honey_frame_count between 0 and 30),
  pollen_frame_count    smallint check (pollen_frame_count between 0 and 30),
  population            population_strength,
  pollen_importation    boolean,

  -- celle reali e comportamento
  queen_cells           queen_cells_type not null default 'nessuna',
  behavior              behavior_type,

  -- patologie (multi-select)
  pathologies           pathology[] not null default '{}',

  -- varroa (opzionale)
  varroa_count          numeric(6, 2),
  varroa_count_method   varroa_count_method,

  -- interventi e melari
  interventions         text[] not null default '{}',
  melari_count          smallint not null default 0
                          check (melari_count between 0 and 10),

  -- testo libero
  notes                 text,

  -- audit
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- coerenza varroa: se c''è il valore deve esserci anche il metodo
  check (
    (varroa_count is null and varroa_count_method is null)
    or
    (varroa_count is not null and varroa_count_method is not null)
  )
);

comment on table public.inspections is
  'Ispezioni di un''arnia. Record immutabile dal punto di vista '
  'applicativo (l''utente può modificare entro un breve lasso, '
  'ma da MVP nessuna policy DB lo impedisce).';

comment on column public.inspections.melari_count is
  'Numero di melari presenti SUL''ARNIA al termine dell''ispezione. '
  'Usato dal controllo trattamenti antivarroa per validare incompatibilità.';

create trigger inspections_set_timestamp
  before update on public.inspections
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 12. TRATTAMENTI
-- =====================================================================
-- Un trattamento può coinvolgere più arnie (anche di apiari diversi
-- in teoria, ma in pratica sempre dello stesso apiario). La M:N è
-- in treatment_hives.

create table public.treatments (
  id              uuid primary key default gen_random_uuid(),
  apiary_id       uuid not null references public.apiaries(id) on delete restrict,
  product_name    text not null,  -- es: "Apivar", "Api-Bioxal", testo libero
  -- "antivarroa con esclusione melari": determina se l''app deve
  -- avvisare quando le arnie hanno melari montati al momento del trattamento
  blocks_melari   boolean not null default true,
  start_date      date not null,
  end_date        date,
  dosage_notes    text,
  cost_eur        numeric(8, 2) check (cost_eur >= 0),
  performed_by    uuid not null references public.profiles(id),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

comment on table public.treatments is
  'Trattamenti sanitari registrati. Le arnie coinvolte sono in treatment_hives.';

create trigger treatments_set_timestamp
  before update on public.treatments
  for each row execute function public.trigger_set_timestamp();

-- Tabella di giunzione N:M
create table public.treatment_hives (
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  hive_id      uuid not null references public.hives(id) on delete restrict,
  primary key (treatment_id, hive_id)
);


-- =====================================================================
-- 13. RACCOLTI
-- =====================================================================

create table public.harvests (
  id              uuid primary key default gen_random_uuid(),
  apiary_id       uuid not null references public.apiaries(id) on delete restrict,
  harvested_on    date not null,
  honey_type      text not null,
  -- es: 'acacia','castagno','tiglio','millefiori','melata','sulla',
  --     'agrumi','eucalipto','altro'
  -- Tenuto come TEXT per estensibilità senza migrazioni.
  total_kg        numeric(8, 2) not null check (total_kg > 0),
  humidity_pct    numeric(4, 1) check (humidity_pct between 0 and 100),
  batch_code      text,
  notes           text,
  recorded_by     uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger harvests_set_timestamp
  before update on public.harvests
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 14. PROMEMORIA
-- =====================================================================

create table public.reminders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  title              text not null check (length(title) between 1 and 200),
  description        text,
  due_at             timestamptz not null,
  recurrence         reminder_recurrence not null default 'none',
  scope              reminder_scope not null,
  apiary_id          uuid references public.apiaries(id) on delete cascade,
  hive_id            uuid references public.hives(id) on delete cascade,
  push_enabled       boolean not null default true,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- coerenza scope <-> riferimenti
  check (
    (scope = 'global' and apiary_id is null and hive_id is null)
    or
    (scope = 'apiary' and apiary_id is not null and hive_id is null)
    or
    (scope = 'hive'   and hive_id is not null)
  )
);

comment on table public.reminders is
  'Promemoria personali dell''utente. Il reminder annuale BDA non '
  'sta in questa tabella ma è generato lato client se l''utente possiede '
  'un apiario con bda_codice_aziendale valorizzato.';

create trigger reminders_set_timestamp
  before update on public.reminders
  for each row execute function public.trigger_set_timestamp();


-- =====================================================================
-- 15. MEDIA (foto/video)
-- =====================================================================
-- Un media è agganciato a UN solo target tra: apiary, hive, inspection.
-- Lo storage fisico è in un bucket Supabase, qui c''è solo il puntatore.

create table public.media (
  id              uuid primary key default gen_random_uuid(),
  kind            media_kind not null,
  storage_path    text not null,  -- path nel bucket Supabase
  thumbnail_path  text,
  caption         text,
  apiary_id       uuid references public.apiaries(id) on delete cascade,
  hive_id         uuid references public.hives(id) on delete cascade,
  inspection_id   uuid references public.inspections(id) on delete cascade,
  uploaded_by     uuid not null references public.profiles(id),
  size_bytes      bigint check (size_bytes > 0),
  width           integer,
  height          integer,
  duration_seconds integer,  -- solo per video
  created_at      timestamptz not null default now(),

  -- esattamente uno dei tre target deve essere valorizzato
  constraint media_target_exclusive check (
    (case when apiary_id     is not null then 1 else 0 end) +
    (case when hive_id       is not null then 1 else 0 end) +
    (case when inspection_id is not null then 1 else 0 end) = 1
  )
);

comment on table public.media is
  'Riferimenti a foto e video. Il binario sta nel bucket Supabase Storage.';


-- =====================================================================
-- 16. INDICI
-- =====================================================================
-- PK e UNIQUE creano già indici. Aggiungiamo gli accessi più frequenti.

create index idx_apiaries_owner       on public.apiaries(owner_id) where archived_at is null;
create index idx_hives_apiary         on public.hives(apiary_id) where archived_at is null;
create index idx_hives_status         on public.hives(status);
create index idx_inspections_hive_at  on public.inspections(hive_id, performed_at desc);
create index idx_inspections_perf_by  on public.inspections(performed_by);
create index idx_treatments_apiary    on public.treatments(apiary_id, start_date desc);
create index idx_treatment_hives_hive on public.treatment_hives(hive_id);
create index idx_harvests_apiary      on public.harvests(apiary_id, harvested_on desc);
create index idx_reminders_user_due   on public.reminders(user_id, due_at) where completed_at is null;
create index idx_reminders_apiary     on public.reminders(apiary_id) where apiary_id is not null;
create index idx_reminders_hive       on public.reminders(hive_id)   where hive_id   is not null;
create index idx_media_apiary         on public.media(apiary_id)     where apiary_id is not null;
create index idx_media_hive           on public.media(hive_id)       where hive_id   is not null;
create index idx_media_inspection     on public.media(inspection_id) where inspection_id is not null;
create index idx_apiary_access_user   on public.apiary_access(user_id);
create index idx_hive_access_user     on public.hive_access(user_id);
create index idx_invites_email        on public.apiary_invites(email) where accepted_at is null;
create index idx_queens_hive          on public.queens(hive_id);


-- =====================================================================
-- 17. FUNZIONI HELPER PER RLS
-- =====================================================================
-- Le policy RLS dirette su apiaries/hives/access creerebbero ricorsione.
-- Le racchiudo in funzioni SECURITY DEFINER così l''interno bypassa RLS
-- in modo controllato (search_path bloccato a public).

create or replace function public.user_can_read_apiary(p_apiary_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from apiaries a
    where a.id = p_apiary_id
      and (
        a.owner_id = auth.uid()
        or exists (
          select 1 from apiary_access aa
          where aa.apiary_id = p_apiary_id and aa.user_id = auth.uid()
        )
        or exists (
          select 1 from hives h
          join hive_access ha on ha.hive_id = h.id
          where h.apiary_id = p_apiary_id and ha.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.user_can_write_apiary(p_apiary_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from apiaries a
    where a.id = p_apiary_id
      and (
        a.owner_id = auth.uid()
        or exists (
          select 1 from apiary_access aa
          where aa.apiary_id = p_apiary_id
            and aa.user_id   = auth.uid()
            and aa.role      = 'editor'
        )
      )
  );
$$;

create or replace function public.user_owns_apiary(p_apiary_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from apiaries a
    where a.id = p_apiary_id and a.owner_id = auth.uid()
  );
$$;

create or replace function public.user_can_read_hive(p_hive_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from hives h
    where h.id = p_hive_id
      and (
        public.user_can_read_apiary(h.apiary_id)
        or exists (
          select 1 from hive_access ha
          where ha.hive_id = p_hive_id and ha.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.user_can_write_hive(p_hive_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from hives h
    where h.id = p_hive_id
      and (
        public.user_can_write_apiary(h.apiary_id)
        or exists (
          select 1 from hive_access ha
          where ha.hive_id = p_hive_id
            and ha.user_id  = auth.uid()
            and ha.role     = 'editor'
        )
      )
  );
$$;


-- =====================================================================
-- 18. ABILITAZIONE RLS
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.apiaries         enable row level security;
alter table public.apiary_access    enable row level security;
alter table public.apiary_invites   enable row level security;
alter table public.hives            enable row level security;
alter table public.hive_access      enable row level security;
alter table public.queens           enable row level security;
alter table public.inspections      enable row level security;
alter table public.treatments       enable row level security;
alter table public.treatment_hives  enable row level security;
alter table public.harvests         enable row level security;
alter table public.reminders        enable row level security;
alter table public.media            enable row level security;


-- =====================================================================
-- 19. POLICY RLS
-- =====================================================================

-- ---- profiles ----
-- Lettura: tutti i profili sono leggibili da utenti autenticati
-- (servono per mostrare nomi nei membri condivisi, autori ispezioni, etc.).
-- In v2 si potrebbe restringere ai soli profili che condividono almeno
-- una risorsa con l''utente.
create policy profiles_read on public.profiles
  for select using (auth.uid() is not null);

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());


-- ---- apiaries ----
create policy apiaries_select on public.apiaries
  for select using (public.user_can_read_apiary(id));

create policy apiaries_insert on public.apiaries
  for insert with check (owner_id = auth.uid());

create policy apiaries_update on public.apiaries
  for update using (public.user_can_write_apiary(id))
              with check (public.user_can_write_apiary(id));

create policy apiaries_delete on public.apiaries
  for delete using (public.user_owns_apiary(id));


-- ---- apiary_access ----
-- Vede l''accesso: il diretto interessato + l''owner dell''apiario.
-- Modifica/cancella/inserisce: solo l''owner.
create policy apiary_access_select on public.apiary_access
  for select using (
    user_id = auth.uid() or public.user_owns_apiary(apiary_id)
  );

create policy apiary_access_insert on public.apiary_access
  for insert with check (public.user_owns_apiary(apiary_id));

create policy apiary_access_update on public.apiary_access
  for update using (public.user_owns_apiary(apiary_id))
              with check (public.user_owns_apiary(apiary_id));

create policy apiary_access_delete on public.apiary_access
  for delete using (public.user_owns_apiary(apiary_id));


-- ---- apiary_invites ----
create policy invites_select on public.apiary_invites
  for select using (public.user_owns_apiary(apiary_id));

create policy invites_insert on public.apiary_invites
  for insert with check (public.user_owns_apiary(apiary_id));

create policy invites_delete on public.apiary_invites
  for delete using (public.user_owns_apiary(apiary_id));


-- ---- hives ----
create policy hives_select on public.hives
  for select using (public.user_can_read_hive(id));

create policy hives_insert on public.hives
  for insert with check (public.user_can_write_apiary(apiary_id));

create policy hives_update on public.hives
  for update using (public.user_can_write_hive(id))
              with check (public.user_can_write_hive(id));

create policy hives_delete on public.hives
  for delete using (public.user_owns_apiary(apiary_id));


-- ---- hive_access ----
create policy hive_access_select on public.hive_access
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from hives h
      where h.id = hive_access.hive_id
        and public.user_owns_apiary(h.apiary_id)
    )
  );

create policy hive_access_insert on public.hive_access
  for insert with check (
    exists (
      select 1 from hives h
      where h.id = hive_access.hive_id
        and public.user_owns_apiary(h.apiary_id)
    )
  );

create policy hive_access_delete on public.hive_access
  for delete using (
    exists (
      select 1 from hives h
      where h.id = hive_access.hive_id
        and public.user_owns_apiary(h.apiary_id)
    )
  );


-- ---- queens ----
create policy queens_select on public.queens
  for select using (public.user_can_read_hive(hive_id));

create policy queens_insert on public.queens
  for insert with check (public.user_can_write_hive(hive_id));

create policy queens_update on public.queens
  for update using (public.user_can_write_hive(hive_id))
              with check (public.user_can_write_hive(hive_id));

create policy queens_delete on public.queens
  for delete using (public.user_can_write_hive(hive_id));


-- ---- inspections ----
create policy inspections_select on public.inspections
  for select using (public.user_can_read_hive(hive_id));

create policy inspections_insert on public.inspections
  for insert with check (
    public.user_can_write_hive(hive_id)
    and performed_by = auth.uid()
  );

-- Update consentita solo all''autore, per mantenere integrità dello storico.
create policy inspections_update on public.inspections
  for update using (
    performed_by = auth.uid()
    and public.user_can_write_hive(hive_id)
  ) with check (
    performed_by = auth.uid()
    and public.user_can_write_hive(hive_id)
  );

create policy inspections_delete on public.inspections
  for delete using (
    performed_by = auth.uid()
    and public.user_can_write_hive(hive_id)
  );


-- ---- treatments ----
create policy treatments_select on public.treatments
  for select using (public.user_can_read_apiary(apiary_id));

create policy treatments_insert on public.treatments
  for insert with check (
    public.user_can_write_apiary(apiary_id)
    and performed_by = auth.uid()
  );

create policy treatments_update on public.treatments
  for update using (
    performed_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  ) with check (
    performed_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  );

create policy treatments_delete on public.treatments
  for delete using (
    performed_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  );


-- ---- treatment_hives ----
create policy treatment_hives_select on public.treatment_hives
  for select using (
    exists (
      select 1 from treatments t
      where t.id = treatment_hives.treatment_id
        and public.user_can_read_apiary(t.apiary_id)
    )
  );

create policy treatment_hives_insert on public.treatment_hives
  for insert with check (
    exists (
      select 1 from treatments t
      where t.id = treatment_hives.treatment_id
        and public.user_can_write_apiary(t.apiary_id)
    )
    and public.user_can_write_hive(hive_id)
  );

create policy treatment_hives_delete on public.treatment_hives
  for delete using (
    exists (
      select 1 from treatments t
      where t.id = treatment_hives.treatment_id
        and t.performed_by = auth.uid()
    )
  );


-- ---- harvests ----
create policy harvests_select on public.harvests
  for select using (public.user_can_read_apiary(apiary_id));

create policy harvests_insert on public.harvests
  for insert with check (
    public.user_can_write_apiary(apiary_id)
    and recorded_by = auth.uid()
  );

create policy harvests_update on public.harvests
  for update using (
    recorded_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  ) with check (
    recorded_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  );

create policy harvests_delete on public.harvests
  for delete using (
    recorded_by = auth.uid()
    and public.user_can_write_apiary(apiary_id)
  );


-- ---- reminders ----
-- Personali: ogni utente vede e gestisce solo i propri.
create policy reminders_all on public.reminders
  for all using (user_id = auth.uid())
          with check (user_id = auth.uid());


-- ---- media ----
create policy media_select on public.media
  for select using (
    case
      when apiary_id     is not null then public.user_can_read_apiary(apiary_id)
      when hive_id       is not null then public.user_can_read_hive(hive_id)
      when inspection_id is not null then exists (
        select 1 from inspections i
        where i.id = media.inspection_id
          and public.user_can_read_hive(i.hive_id)
      )
      else false
    end
  );

create policy media_insert on public.media
  for insert with check (
    uploaded_by = auth.uid()
    and case
      when apiary_id     is not null then public.user_can_write_apiary(apiary_id)
      when hive_id       is not null then public.user_can_write_hive(hive_id)
      when inspection_id is not null then exists (
        select 1 from inspections i
        where i.id = media.inspection_id
          and public.user_can_write_hive(i.hive_id)
      )
      else false
    end
  );

create policy media_delete on public.media
  for delete using (
    uploaded_by = auth.uid()
    or case
      when apiary_id     is not null then public.user_owns_apiary(apiary_id)
      when hive_id       is not null then exists (
        select 1 from hives h
        where h.id = media.hive_id
          and public.user_owns_apiary(h.apiary_id)
      )
      when inspection_id is not null then exists (
        select 1 from inspections i
        join hives h on h.id = i.hive_id
        where i.id = media.inspection_id
          and public.user_owns_apiary(h.apiary_id)
      )
      else false
    end
  );


-- =====================================================================
-- 20. STORAGE BUCKET (eseguire dopo dalla dashboard Supabase)
-- =====================================================================
-- I bucket si creano dalla dashboard Supabase (Storage). Indicazioni:
--
--   1) Bucket name:        apidiario-media
--   2) Public:             NO (privato, accessi solo via signed URL)
--   3) File size limit:    20 MB per file
--   4) Allowed MIME types: image/jpeg, image/png, image/heic,
--                          image/webp, video/mp4, video/quicktime
--
-- Le policy del bucket vanno definite a parte; un buon set iniziale è:
--
--   - SELECT/INSERT consentito al solo proprietario del file (owner = auth.uid())
--   - DELETE consentito al proprietario o all'owner della risorsa associata
--
-- Una validazione più stringente (allineata alle RLS della tabella media)
-- la facciamo successivamente con una funzione di hook lato client che
-- verifica le permission prima di chiedere l''upload URL.


-- =====================================================================
-- FINE SCHEMA
-- =====================================================================