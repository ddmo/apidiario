-- =====================================================================
-- Test: ruolo reader può leggere ma NON scrivere/cancellare
-- =====================================================================
-- Scenario A: Anna concede apiary_access reader a Stefano.
--   Stefano vede apiario ma non può modificarlo né cancellarlo.
-- Scenario B: Anna concede hive_access reader a Stefano su H1.
--   Stefano vede H1 ma non può modificarlo.
-- =====================================================================

begin;

select plan(6);


-- ---------------------------------------------------------------------
-- SETUP: due utenti finti
-- ---------------------------------------------------------------------
insert into auth.users
  (id, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'anna@test.local',
   '', now(), now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'stefano@test.local',
   '', now(), now(), now(), 'authenticated', 'authenticated');


-- ---------------------------------------------------------------------
-- SETUP: apiario di Anna + arnia H1 (bypass RLS)
-- ---------------------------------------------------------------------
set local role postgres;

insert into public.apiaries (id, owner_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Apiario di Anna');

insert into public.hives (id, apiary_id, identifier)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'H1');


-- =====================================================================
-- SCENARIO A: apiary_access reader
-- =====================================================================

insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'reader',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 1: reader VEDE apiario
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Reader vede apiario condiviso'
);


-- ---------------------------------------------------------------------
-- TEST 2: reader NON PUO'' aggiornare apiario
-- ---------------------------------------------------------------------
update public.apiaries
set name = 'Apiario modificato da reader'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select name from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Apiario di Anna',
  'Reader non puo aggiornare apiario'
);


-- ---------------------------------------------------------------------
-- TEST 3: reader NON PUO'' cancellare apiario
-- ---------------------------------------------------------------------
delete from public.apiaries
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Reader non puo cancellare apiario'
);


-- =====================================================================
-- SCENARIO B: hive_access reader
-- =====================================================================

reset role;
set local role postgres;

insert into public.hive_access (hive_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '22222222-2222-2222-2222-222222222222',
        'reader',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 4: reader VEDE arnia
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Reader vede arnia condivisa'
);


-- ---------------------------------------------------------------------
-- TEST 5: reader NON PUO'' aggiornare arnia
-- ---------------------------------------------------------------------
update public.hives
set identifier = 'H1-modificata-da-reader'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';

select is(
  (select identifier from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  'H1',
  'Reader non puo aggiornare arnia'
);


-- =====================================================================
-- TEST 6: reader NON PUO'' cancellare arnia
-- =====================================================================
delete from public.hives
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';

select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Reader non puo cancellare arnia'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
