-- =====================================================================
-- Test: RLS ispezioni — ereditano permessi arnia + performed_by
-- =====================================================================
-- Scenario: Anna possiede apiario con arnia H1 e fa un'ispezione.
-- Stefano non ha accesso.
-- Dopo aver ottenuto editor su H1, Stefano deve: vedere ispezione
-- di Anna, inserire propria ispezione, modificare/cancellare SOLO
-- le proprie (perché performed_by = auth.uid()).
-- =====================================================================

begin;

select plan(7);


-- ---------------------------------------------------------------------
-- SETUP: utenti, apiario, arnia
-- ---------------------------------------------------------------------
insert into auth.users
  (id, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'anna@test.local',
   '', now(), now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'stefano@test.local',
   '', now(), now(), now(), 'authenticated', 'authenticated');

set local role postgres;

insert into public.apiaries (id, owner_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Apiario di Anna');

insert into public.hives (id, apiary_id, identifier)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'H1');


-- ---------------------------------------------------------------------
-- TEST 1: Stefano (nessun accesso) vede 0 ispezioni
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.inspections
   where hive_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  0,
  'Stefano non vede ispezioni (nessun accesso)'
);


-- ---------------------------------------------------------------------
-- SETUP: Anna crea un'ispezione su H1 (bypass RLS)
-- ---------------------------------------------------------------------
reset role;
set local role postgres;

insert into public.inspections (id, hive_id, performed_by, notes)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '11111111-1111-1111-1111-111111111111',
        'Ispezione di Anna');


-- ---------------------------------------------------------------------
-- SETUP: Stefano ottiene apiary_access editor sull'apiario
-- ---------------------------------------------------------------------
insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 2: Stefano VEDE ispezione di Anna (eredita permesso arnia)
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.inspections
   where hive_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Stefano vede ispezione di Anna (accesso ereditato via hive)'
);


-- ---------------------------------------------------------------------
-- TEST 3: Stefano INSERISCE propria ispezione su H1
-- ---------------------------------------------------------------------
insert into public.inspections (id, hive_id, performed_by, notes)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '22222222-2222-2222-2222-222222222222',
        'Ispezione di Stefano');

select is(
  (select count(*)::int from public.inspections
   where notes = 'Ispezione di Stefano'),
  1,
  'Stefano inserisce propria ispezione (write hive + performed_by = self)'
);


-- ---------------------------------------------------------------------
-- TEST 4: Stefano NON PUO'' modificare ispezione di Anna
-- (performed_by diverso da auth.uid())
-- ---------------------------------------------------------------------
update public.inspections
set notes = 'Modifica non autorizzata'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10';

select is(
  (select notes from public.inspections
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'),
  'Ispezione di Anna',
  'Stefano non modifica ispezione di Anna (performed_by non corrisponde)'
);


-- ---------------------------------------------------------------------
-- TEST 5: Stefano MODIFICA propria ispezione
-- ---------------------------------------------------------------------
update public.inspections
set notes = 'Ispezione di Stefano (modificata)'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11';

select is(
  (select notes from public.inspections
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'),
  'Ispezione di Stefano (modificata)',
  'Stefano modifica propria ispezione (performed_by = self)'
);


-- ---------------------------------------------------------------------
-- TEST 6: Stefano NON PUO'' cancellare ispezione di Anna
-- ---------------------------------------------------------------------
delete from public.inspections
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10';

select is(
  (select count(*)::int from public.inspections
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'),
  1,
  'Stefano non cancella ispezione di Anna (performed_by non corrisponde)'
);


-- ---------------------------------------------------------------------
-- TEST 7: Stefano CANCELLA propria ispezione
-- ---------------------------------------------------------------------
delete from public.inspections
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11';

select is(
  (select count(*)::int from public.inspections
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'),
  0,
  'Stefano cancella propria ispezione (performed_by = self)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
