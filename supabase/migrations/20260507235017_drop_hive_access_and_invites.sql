-- =====================================================================
-- Drop hive_access e apiary_invites
-- =====================================================================
-- Decisione di prodotto: la condivisione è solo a livello di apiario.
-- Non si condividono singole arnie. Inoltre gli inviti pending a email
-- non registrate non sono più previsti.
--
 -- Strategy: CREATE OR REPLACE FUNCTION per rimuovere i riferimenti a
-- hive_access dalle 3 funzioni helper (firma invariata). Le policy
-- esistenti continuano a funzionare perché le funzioni hanno stesso
-- nome e stessa firma. Poi DROP TABLE CASCADE per eliminare le tabelle
-- e le loro policy RLS.
-- =====================================================================

-- 1. Riscrivi user_can_read_apiary senza JOIN hive_access
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
      )
  );
$$;


-- 2. Riscrivi user_can_read_hive senza SELECT da hive_access
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
      and public.user_can_read_apiary(h.apiary_id)
  );
$$;


-- 3. Riscrivi user_can_write_hive senza SELECT da hive_access
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
      and public.user_can_write_apiary(h.apiary_id)
  );
$$;


-- 4. Drop tabelle (cascade elimina anche policy RLS su di esse)
drop table if exists public.hive_access cascade;
drop table if exists public.apiary_invites cascade;
