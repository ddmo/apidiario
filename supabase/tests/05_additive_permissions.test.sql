-- =====================================================================
-- Test: permessi additivi — vale il livello più alto
-- =====================================================================
-- Scenario: Stefano ha apiary_access reader sull'apiario di Anna.
-- Inoltre ha hive_access editor sull'arnia H1 (ma non H2).
--
-- Su H1: editor > reader → può scrivere (additivo, vince il più alto).
-- Su H2: solo reader → non può scrivere.
-- Sull'apiario: apiary_access reader → non può aggiornare metadati.
-- =====================================================================

begin;

select plan(4);


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
-- SETUP: apiario + H1 + H2 + apiary_access reader + hive_access editor
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

-- livello basso sull'apiario
insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'reader',
        '11111111-1111-1111-1111-111111111111');

-- livello alto su H1
insert into public.hive_access (hive_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 1: Stefano (reader apiario + editor H1) VEDE H1
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  1,
  'Stefano vede H1 (reader apiario)'
);


-- ---------------------------------------------------------------------
-- TEST 2: Stefano SCRIVE H1 (editor vince su reader, additivo)
-- ---------------------------------------------------------------------
update public.hives
set notes = 'modifica da editor su H1'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';

select is(
  (select notes from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  'modifica da editor su H1',
  'Stefano scrive H1 (editor hive > reader apiario, additivo)'
);


-- ---------------------------------------------------------------------
-- TEST 3: Stefano NON scrive H2 (solo reader, nessun editor su H2)
-- ---------------------------------------------------------------------
update public.hives
set notes = 'tentativo modifica H2'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02';

select is(
  (select notes from public.hives
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'),
  null,
  'Stefano non scrive H2 (solo reader apiario, editor solo su H1)'
);


-- ---------------------------------------------------------------------
-- TEST 4: Stefano NON aggiorna apiario (apiary_access reader, non editor)
-- ---------------------------------------------------------------------
update public.apiaries
set name = 'Apiario modificato da reader'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select name from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Apiario di Anna',
  'Stefano non aggiorna apiario (apiary_access reader)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
