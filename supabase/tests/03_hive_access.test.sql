-- =====================================================================
-- Test: condivisione arnia via hive_access (senza apiary_access)
-- =====================================================================
-- Scenario: Anna possiede Apiario A con due arnie (H1, H2).
-- Stefano NON ha accesso a livello apiario.
-- Anna concede a Stefano hive_access editor su H1 soltanto.
--
-- Nota: per design, hive_access su una qualsiasi arnia dell'apiario
-- concede lettura su TUTTE le arnie (user_can_read_apiary include
-- il check su hive_access). La scrittura invece è granulare:
-- serve hive_access editor sull'arnia specifica o apiary_access.
-- =====================================================================

begin;

select plan(8);


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
-- SETUP: apiario di Anna con due arnie (bypass RLS)
-- ---------------------------------------------------------------------
set local role postgres;

insert into public.apiaries (id, owner_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Apiario di Anna');

insert into public.hives (id, apiary_id, identifier)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'H1'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'H2');


-- ---------------------------------------------------------------------
-- TEST 1: Stefano NON vede arnie dell''apiario di Anna
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.hives
   where apiary_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Stefano non vede arnie apiario Anna (nessun accesso)'
);


-- ---------------------------------------------------------------------
-- SETUP: Anna concede hive_access editor su H1 a Stefano
-- ---------------------------------------------------------------------
reset role;
set local role postgres;

insert into public.hive_access (hive_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 2: Stefano VEDE H1 (ha hive_access)
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Stefano vede H1 (ha hive_access)'
);


-- ---------------------------------------------------------------------
-- TEST 3: Stefano vede ANCHE H2 (hive_access su H1 sblocca lettura apiario)
-- ---------------------------------------------------------------------
select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'),
  1,
  'Stefano vede H2 (hive_access su H1 sblocca lettura intero apiario)'
);


-- ---------------------------------------------------------------------
-- TEST 4: Stefano PUO'' aggiornare H1 (editor)
-- ---------------------------------------------------------------------
update public.hives
set identifier = 'H1-modificata'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';

select is(
  (select identifier from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  'H1-modificata',
  'Stefano (editor) puo aggiornare H1'
);


-- ---------------------------------------------------------------------
-- TEST 5: Stefano NON PUO'' aggiornare H2 (write granulare, no editor su H2)
-- ---------------------------------------------------------------------
update public.hives
set notes = 'tentativo modifica non autorizzata'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02';

select is(
  (select notes from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'),
  null,
  'Stefano non puo aggiornare H2 (write granulare per arnia)'
);


-- ---------------------------------------------------------------------
-- TEST 6: Stefano NON PUO'' cancellare H1 (solo owner apiario)
-- ---------------------------------------------------------------------
delete from public.hives
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';

select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Stefano non puo cancellare H1 (solo owner)'
);


-- ---------------------------------------------------------------------
-- TEST 7: Stefano VEDE record hive_access che lo riguarda
-- ---------------------------------------------------------------------
select is(
  (select count(*)::int from public.hive_access
   where hive_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'
     and user_id = '22222222-2222-2222-2222-222222222222'),
  1,
  'Stefano vede proprio record hive_access'
);


-- ---------------------------------------------------------------------
-- TEST 8: Anna (owner) vede TUTTI i record hive_access apiario
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.hive_access ha
   join public.hives h on h.id = ha.hive_id
   where h.apiary_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Anna (owner) vede record hive_access da lei concesso'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
