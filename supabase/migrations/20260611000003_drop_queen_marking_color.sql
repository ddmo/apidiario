-- ⚠️ DA APPLICARE SOLO DOPO aver verificato che la conversione dati
--    (is_marked + birth_year) della migration 20260611000001 è corretta.
--
-- Per applicarla:
--   1. Sposta questo file in supabase/migrations/
--   2. npx supabase db push  (o psql -f con la connection string)
--
-- Drop irreversibile. L'enum queen_marking_color resta: è usato lato app
-- come tipo del colore derivato dall'anno di nascita.

ALTER TABLE public.queens
  DROP COLUMN marking_color;
