-- =====================================================================
-- Test: RLS media — polimorfa (apiary/hive), uploaded_by, delete
-- =====================================================================
-- Scenario: Anna possiede apiario con arnia H1.
-- Stefano ha apiary_access editor.
-- Media puo essere collegato a apiary, hive, o inspection.
-- Lettura: ereditata dal target. Inserimento: uploaded_by = self + write.
-- Cancellazione: uploader o owner del target.
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
-- SETUP: Stefano ottiene apiary_access editor
-- ---------------------------------------------------------------------
insert into public.apiary_access (apiary_id, user_id, role, granted_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        'editor',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 1: Stefano vede 0 media (nessun media ancora)
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.media),
  0,
  'Stefano vede 0 media (nessuno ancora inserito)'
);


-- ---------------------------------------------------------------------
-- SETUP: Anna inserisce media su apiario (bypass RLS)
-- ---------------------------------------------------------------------
reset role;
set local role postgres;

insert into public.media (id, kind, storage_path, apiary_id, uploaded_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20',
        'photo',
        '/apiario-di-anna/foto1.jpg',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111');


-- ---------------------------------------------------------------------
-- TEST 2: Stefano VEDE media su apiario (eredita permesso apiario)
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.media
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20'),
  1,
  'Stefano vede media su apiario (eredita lettura apiario)'
);


-- ---------------------------------------------------------------------
-- TEST 3: Stefano INSERISCE media su apiario (write_apiary + self)
-- ---------------------------------------------------------------------
insert into public.media (id, kind, storage_path, apiary_id, uploaded_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21',
        'video',
        '/apiario-di-anna/Stefano-video.mp4',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from public.media
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21'),
  1,
  'Stefano inserisce media su apiario (uploaded_by = self + write_apiary)'
);


-- ---------------------------------------------------------------------
-- TEST 4: Stefano INSERISCE media su H1 (write_hive + self)
-- ---------------------------------------------------------------------
insert into public.media (id, kind, storage_path, hive_id, uploaded_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22',
        'photo',
        '/apiario-di-anna/h1/foto-stefano.jpg',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
        '22222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from public.media
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22'),
  1,
  'Stefano inserisce media su H1 (write_hive + uploaded_by = self)'
);


-- ---------------------------------------------------------------------
-- TEST 5: Stefano NON PUO'' inserire media come Anna (uploaded_by !~ auth.uid())
-- La policy with check solleva errore, non aggiorna 0 righe.
-- ---------------------------------------------------------------------
select throws_ok(
  $$insert into public.media (id, kind, storage_path, apiary_id, uploaded_by)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', 'photo',
            '/apiario-di-anna/falso.jpg',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '11111111-1111-1111-1111-111111111111')$$,
  'new row violates row-level security policy for table "media"',
  'Stefano non inserisce media come Anna (uploaded_by deve essere self)'
);


-- ---------------------------------------------------------------------
-- TEST 6: Stefano CANCELLA proprio media su H1
-- ---------------------------------------------------------------------
delete from public.media
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22';

select is(
  (select count(*)::int from public.media
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22'),
  0,
  'Stefano cancella proprio media (uploaded_by = self)'
);


-- ---------------------------------------------------------------------
-- TEST 7: Stefano NON CANCELLA media di Anna (non uploader ne owner)
-- ---------------------------------------------------------------------
delete from public.media
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20';

select is(
  (select count(*)::int from public.media
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20'),
  1,
  'Stefano non cancella media di Anna (non e uploader ne owner apiario)'
);


-- ---------------------------------------------------------------------
-- TEARDOWN
-- ---------------------------------------------------------------------
select * from finish();
rollback;
