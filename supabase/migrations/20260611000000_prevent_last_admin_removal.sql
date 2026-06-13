-- =====================================================================
-- Migrazione: impedisce la rimozione dell'ultimo amministratore
-- =====================================================================
-- La policy app_admins_delete consente a qualsiasi admin di cancellare
-- righe (anche la propria) via client, bypassando la edge function
-- admin-remove-admin. Senza protezione DB si può svuotare del tutto
-- app_admins → lockout amministrativo irreversibile.
--
-- Trigger BEFORE DELETE: blocca l'eliminazione se lascerebbe 0 admin.
-- =====================================================================

create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.app_admins) <= 1 then
    raise exception 'Impossibile rimuovere l''ultimo amministratore';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_last_admin_removal on public.app_admins;

create trigger trg_prevent_last_admin_removal
  before delete on public.app_admins
  for each row execute function public.prevent_last_admin_removal();
