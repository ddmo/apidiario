# Test RLS con pgTAP

## Come lanciare i test

```bash
supabase test db
```

## Convenzione naming

`NN_descrizione.test.sql` — numerazione progressiva (01, 02, 03...).

## Pattern di ogni test

```sql
begin;
select plan(N);
-- ... test ...
select * from finish();
rollback;
```

`begin` + `rollback` rende ogni test atomico e ripetibile senza
sporcare il DB.

## Simulare un utente loggato

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid>"}';
```

Le policy RLS leggono `auth.uid()` che a sua volta legge il claim `sub`
dal JWT. `set local` vale solo per la transazione corrente (grazie a
`begin`/`rollback`).

## Account finti in `auth.users`

Inseriamo utenti finti direttamente in `auth.users` perché in locale
vogliamo testare le RLS, non il flow Auth (OTP, password, magic link,
etc.).

## Bypassare RLS nel setup

```sql
set local role postgres;
```

`postgres` bypassa RLS. Utile in fase di setup per creare dati di
proprietà di utenti diversi dal chiamante.
