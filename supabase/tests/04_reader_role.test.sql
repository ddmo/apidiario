-- =====================================================================
-- Test: ruolo reader (apiary_access) — può leggere ma NON scrivere/cancellare
-- =====================================================================
-- Scenario: Anna concede apiary_access reader a Stefano.
-- Stefano vede apiario ma non può modificarlo né cancellarlo.
-- =====================================================================

begin;

select plan(3);


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
-- SETUP: apiario di Anna (bypass RLS)
-- ---------------------------------------------------------------------
set local role postgres;

insert into public.apiaries (id, owner_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Apiario di Anna');

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


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
