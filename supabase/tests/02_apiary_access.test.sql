-- =====================================================================
-- Test: condivisione apiario via apiary_access (ruolo editor)
-- =====================================================================
-- Scenario: Anna possiede Apiario A. Stefano non lo vede.
-- Anna concede a Stefano accesso editor via apiary_access.
-- Stefano ora deve: vedere A, modificare A, NON cancellare A.
-- Deve anche vedere il record apiary_access che lo riguarda.
-- =====================================================================

begin;

select plan(6);


-- ---------------------------------------------------------------------
-- SETUP: due utenti finti in auth.users (trigger crea profiles)
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


-- ---------------------------------------------------------------------
-- TEST 1: Stefano NON vede apiario di Anna (ancora non condiviso)
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Stefano non vede apiario di Anna prima della condivisione'
);


-- ---------------------------------------------------------------------
-- SETUP: Anna concede accesso editor a Stefano (bypass RLS)
-- ---------------------------------------------------------------------
reset role;
set local role postgres;

insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 2: dopo condivisione, Stefano VEDE apiario di Anna
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Stefano vede apiario di Anna dopo condivisione'
);


-- ---------------------------------------------------------------------
-- TEST 3: Stefano PUO'' aggiornare nome (ruolo editor)
-- ---------------------------------------------------------------------
update public.apiaries
set name = 'Apiario di Anna (modificato da Stefano)'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select name from public.apiaries where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Apiario di Anna (modificato da Stefano)',
  'Stefano (editor) puo aggiornare nome apiario'
);


-- ---------------------------------------------------------------------
-- TEST 4: Stefano NON PUO'' cancellare apiario (solo owner)
-- ---------------------------------------------------------------------
delete from public.apiaries
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Stefano non puo cancellare apiario (solo owner)'
);


-- ---------------------------------------------------------------------
-- TEST 5: Stefano VEDE record apiary_access che lo riguarda
-- ---------------------------------------------------------------------
select is(
  (select count(*)::int from public.apiary_access
   where apiary_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
     and user_id   = '22222222-2222-2222-2222-222222222222'),
  1,
  'Stefano vede il proprio record apiary_access'
);


-- ---------------------------------------------------------------------
-- TEST 6: Anna (owner) VEDE record apiary_access che ha concesso
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.apiary_access
   where apiary_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Anna (owner) vede il record apiary_access da lei concesso'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
