-- =====================================================================
-- Migrazione: tabella app_admins + helper RLS
-- =====================================================================
-- Crea la tabella degli amministratori applicativi. Solo chi compare
-- qui puo' invitare nuovi utenti e accedere alla pagina /admin/users.
-- =====================================================================
-- BOOTSTRAP (da eseguire a mano dopo la migrazione via SQL editor):
--
--   insert into public.app_admins (user_id, created_by)
--   values ('<your-user-id>', '<your-user-id>');
--
-- Sostituisci <your-user-id> con il tuo UUID da auth.users.
-- Il primo admin si auto-promuove (created_by = se stesso).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tabella amministratori
-- ---------------------------------------------------------------------
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

comment on table public.app_admins is
  'Amministratori applicativi. RLS: solo admin legge/scrive.';

comment on column public.app_admins.created_by is
  'Chi ha promosso questo admin. Il bootstrap si auto-referenzia.';

comment on column public.app_admins.created_at is
  'Data di promozione ad admin.';


-- ---------------------------------------------------------------------
-- Helper SECURITY DEFINER: verifica se l'utente corrente e' admin
-- ---------------------------------------------------------------------
-- Usata dalle policy RLS. SECURITY DEFINER con search_path bloccato
-- per evitare ricorsione.
-- ---------------------------------------------------------------------
create or replace function public.is_app_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

comment on function public.is_app_admin() is
  'RLS helper: true se auth.uid() compare in app_admins.';


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.app_admins enable row level security;

-- SELECT: solo admin vede la tabella (altri vedono 0 righe)
create policy app_admins_select on public.app_admins
  for select using (public.is_app_admin());

-- INSERT: solo admin puo' promuovere altri
create policy app_admins_insert on public.app_admins
  for insert with check (public.is_app_admin());

-- DELETE: solo admin puo' rimuovere admin (demote)
-- Nota: con questa policy un admin puo' rimuovere altri admin,
-- incluso se stesso (self-demotion). La protezione e' lato Edge Function.
create policy app_admins_delete on public.app_admins
  for delete using (public.is_app_admin());
