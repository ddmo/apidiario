-- =====================================================================
-- Test: RLS anon — 0 righe da tutte le tabelle
-- =====================================================================
-- Scenario: L'utente non autenticato (role anon) non vede e non modifica
-- nessuna riga in nessuna tabella con RLS, anche se i dati esistono.
-- =====================================================================

begin;

select plan(14);


-- ---------------------------------------------------------------------
-- SETUP: utenti, apiario, arnia, dati correlati
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

insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');

insert into public.hives (id, apiary_id, identifier)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'H1');

insert into public.queens (id, hive_id, start_date)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa30',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        current_date);

insert into public.inspections (id, hive_id, performed_by, notes)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '11111111-1111-1111-1111-111111111111',
        'Ispezione di Anna');

insert into public.treatments (id, apiary_id, product_name, start_date, performed_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa40',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Apivar',
        current_date,
        '11111111-1111-1111-1111-111111111111');

insert into public.treatment_hives (treatment_id, hive_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa40',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01');

insert into public.harvests (id, apiary_id, harvested_on, honey_type, total_kg, recorded_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa50',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        current_date,
        'millefiori',
        10.5,
        '11111111-1111-1111-1111-111111111111');

insert into public.reminders (id, user_id, title, due_at, scope)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa60',
        '11111111-1111-1111-1111-111111111111',
        'Promemoria di prova',
        now() + interval '1 day',
        'global');

insert into public.media (id, kind, storage_path, apiary_id, uploaded_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20',
        'photo',
        '/apiario-di-anna/foto1.jpg',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 1-11: anon NON VEDE nessuna riga (SELECT)
-- ---------------------------------------------------------------------
reset role;
set local role anon;

select is((select count(*)::int from public.profiles),        0, 'anon vede 0 profiles');
select is((select count(*)::int from public.apiaries),        0, 'anon vede 0 apiari');
select is((select count(*)::int from public.apiary_access),   0, 'anon vede 0 apiary_access');
select is((select count(*)::int from public.hives),           0, 'anon vede 0 arnie');
select is((select count(*)::int from public.queens),          0, 'anon vede 0 regine');
select is((select count(*)::int from public.inspections),     0, 'anon vede 0 ispezioni');
select is((select count(*)::int from public.treatments),      0, 'anon vede 0 trattamenti');
select is((select count(*)::int from public.treatment_hives), 0, 'anon vede 0 treatment_hives');
select is((select count(*)::int from public.harvests),        0, 'anon vede 0 raccolti');
select is((select count(*)::int from public.reminders),       0, 'anon vede 0 promemoria');
select is((select count(*)::int from public.media),           0, 'anon vede 0 media');


-- ---------------------------------------------------------------------
-- TEST 12: anon NON PUO'' INSERIRE (apiaries)
-- ---------------------------------------------------------------------
select throws_ok(
  $$insert into public.apiaries (owner_id, name)
    values ('11111111-1111-1111-1111-111111111111', 'Apiario falso')$$,
  'new row violates row-level security policy for table "apiaries"',
  'anon non inserisce apiario (RLS with check bloccato)'
);


-- ---------------------------------------------------------------------
-- anon tenta UPDATE/DELETE su apiaries (entrambi silenziosi, 0 righe)
-- ---------------------------------------------------------------------
update public.apiaries
set name = 'Hackerato'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

delete from public.apiaries
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';


-- ---------------------------------------------------------------------
-- Verifica postgres: apiario invariato dopo i tentativi anon
-- ---------------------------------------------------------------------
reset role;
set local role postgres;

-- TEST 13
select is(
  (select name from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Apiario di Anna',
  'anon non modifica apiario (UPDATE 0 righe)'
);

-- TEST 14
select is(
  (select count(*)::int from public.apiaries
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'anon non cancella apiario (DELETE 0 righe)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
