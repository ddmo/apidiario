-- =====================================================================
-- Test: RLS app_admins — solo admin legge/scrive
-- =====================================================================
-- Nota: il test anon su app_admins (assertion a) e' qui per
-- pertinenza tematica. Per il pattern anon su tutte le altre
-- tabelle RLS vedi 03_anonymous_access.test.sql.
-- =====================================================================
-- Scenario: Anna e' admin, Stefano no.
-- Solo Anna vede righe, puo' inserire e cancellare.
-- Stefano (non-admin) vede 0 righe e non puo' modificare.
-- =====================================================================

begin;

select plan(7);


-- ---------------------------------------------------------------------
-- SETUP: utenti
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
-- TEST 1: anon vede 0 righe
-- ---------------------------------------------------------------------
set local role anon;

select is(
  (select count(*)::int from public.app_admins),
  0,
  'anon vede 0 righe'
);

reset role;


-- ---------------------------------------------------------------------
-- TEST 2: Stefano (non-admin) vede 0 righe
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.app_admins),
  0,
  'Stefano (non admin) vede 0 righe'
);

reset role;


-- ---------------------------------------------------------------------
-- SETUP: Anna diventa admin (bypass RLS)
-- ---------------------------------------------------------------------
set local role postgres;

insert into public.app_admins (user_id, created_by)
values ('11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 3: Anna (admin) vede 1 riga (se stessa)
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.app_admins),
  1,
  'Anna (admin) vede 1 riga (se stessa)'
);


-- ---------------------------------------------------------------------
-- TEST 4: Anna (admin) INSERT Stefano come admin
-- ---------------------------------------------------------------------
insert into public.app_admins (user_id, created_by)
values ('22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from public.app_admins),
  2,
  'Anna (admin) inserisce Stefano come admin -> 2 righe'
);


-- ---------------------------------------------------------------------
-- TEST 5: Anna (admin) DELETE Stefano da admin
-- ---------------------------------------------------------------------
delete from public.app_admins
where user_id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*)::int from public.app_admins),
  1,
  'Anna (admin) cancella Stefano -> 1 riga (solo Anna)'
);


-- ---------------------------------------------------------------------
-- TEST 6: Stefano (non-admin) NON PUO'' INSERT
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select throws_ok(
  $$insert into public.app_admins (user_id, created_by)
    values ('22222222-2222-2222-2222-222222222222',
            '22222222-2222-2222-2222-222222222222')$$,
  'new row violates row-level security policy for table "app_admins"',
  'Stefano (non admin) non puo'' inserire (RLS with check)'
);


-- ---------------------------------------------------------------------
-- TEST 7: Stefano (non-admin) DELETE silenzioso (0 righe)
-- ---------------------------------------------------------------------
delete from public.app_admins
where user_id = '11111111-1111-1111-1111-111111111111';

-- Verifica come postgres che Anna sia ancora admin
reset role;
set local role postgres;

select is(
  (select count(*)::int from public.app_admins
   where user_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'Stefano (non admin) non cancella Anna (DELETE 0 righe)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
