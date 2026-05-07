-- =====================================================================
-- Test: isolamento base apiari tra utenti
-- =====================================================================
-- Scenario: Anna possiede l'Apiario A. Stefano possiede l'Apiario B.
-- Anna NON deve vedere B. Stefano NON deve vedere A.
-- Questo � il test pi� importante: se fallisce, RLS � rotto alla base.
-- =====================================================================

begin;

select plan(6);


-- ---------------------------------------------------------------------
-- SETUP: due utenti finti in auth.users
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
-- SETUP: Anna crea il suo apiario, Stefano il suo (bypass RLS)
-- ---------------------------------------------------------------------
set local role postgres;

insert into public.apiaries (id, owner_id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Apiario di Anna'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '22222222-2222-2222-2222-222222222222',
   'Apiario di Stefano');


-- ---------------------------------------------------------------------
-- TEST 1+2: Anna vede SOLO il suo apiario
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.apiaries),
  1,
  'Anna vede esattamente 1 apiario (il suo)'
);

select is(
  (select name from public.apiaries),
  'Apiario di Anna',
  'L''apiario che Anna vede � il suo'
);

select is(
  (select count(*)::int from public.apiaries
   where name = 'Apiario di Stefano'),
  0,
  'Anna NON vede l''apiario di Stefano (esclusivit�)'
);


-- ---------------------------------------------------------------------
-- TEST 3+4+5+6: Stefano vede SOLO il suo apiario
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.apiaries),
  1,
  'Stefano vede esattamente 1 apiario (il suo)'
);

select is(
  (select name from public.apiaries),
  'Apiario di Stefano',
  'L''apiario che Stefano vede � il suo'
);

select is(
  (select count(*)::int from public.apiaries
   where name = 'Apiario di Anna'),
  0,
  'Stefano NON vede l''apiario di Anna (esclusivit�)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
