-- Quando un utente viene eliminato, le sue ispezioni/trattamenti/raccolti
-- su arnie/apiari altrui restano visibili ma con performed_by = NULL.
-- Questo evita di perdere dati storici e permette la cancellazione dell'utente.

-- inspections
alter table public.inspections
  alter column performed_by drop not null;

alter table public.inspections
  drop constraint inspections_performed_by_fkey,
  add constraint inspections_performed_by_fkey
    foreign key (performed_by) references public.profiles(id)
    on delete set null;

-- treatments
alter table public.treatments
  alter column performed_by drop not null;

alter table public.treatments
  drop constraint treatments_performed_by_fkey,
  add constraint treatments_performed_by_fkey
    foreign key (performed_by) references public.profiles(id)
    on delete set null;

-- harvests
alter table public.harvests
  alter column recorded_by drop not null;

alter table public.harvests
  drop constraint harvests_recorded_by_fkey,
  add constraint harvests_recorded_by_fkey
    foreign key (recorded_by) references public.profiles(id)
    on delete set null;

-- apiary_access.granted_by (chi ha condiviso — bloccava la cancellazione)
alter table public.apiary_access
  alter column granted_by drop not null;

alter table public.apiary_access
  drop constraint apiary_access_granted_by_fkey,
  add constraint apiary_access_granted_by_fkey
    foreign key (granted_by) references public.profiles(id)
    on delete set null;

-- media.uploaded_by
alter table public.media
  alter column uploaded_by drop not null;

alter table public.media
  drop constraint media_uploaded_by_fkey,
  add constraint media_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id)
    on delete set null;
