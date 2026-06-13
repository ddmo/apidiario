-- Regina: sostituisce `marking_color` con un flag `is_marked`.
-- Il colore di marcatura non è più memorizzato: si ricava dall'anno di nascita
-- seguendo la convenzione internazionale (cifra finale dell'anno → colore).
--
-- Conversione dati esistenti:
--   1. is_marked = (marking_color <> 'non_marcata')
--   2. birth_year (SOLO dove NULL e marcata) = anno più recente <= anno corrente
--      la cui cifra finale corrisponde al colore. Dove birth_year è già
--      valorizzato viene mantenuto (precedenza all'anno esistente).

-- 1. Nuova colonna
ALTER TABLE public.queens
  ADD COLUMN is_marked boolean NOT NULL DEFAULT false;

-- 2. Backfill flag marcata
UPDATE public.queens
SET is_marked = (marking_color <> 'non_marcata');

-- 3. Backfill anno di nascita solo dove mancante e regina marcata.
--    Per ogni colore: anno = max tra gli anni <= corrente che finiscono con
--    una delle due cifre della convenzione.
--    Formula: candidato(e) = Y - ((Y%10 - e + 10) % 10)  → anno <= Y che finisce in e.
UPDATE public.queens AS q
SET birth_year = (
  WITH y AS (SELECT (extract(year FROM current_date))::int AS yy)
  SELECT CASE q.marking_color
    WHEN 'bianco' THEN GREATEST(yy - ((yy % 10 - 1 + 10) % 10), yy - ((yy % 10 - 6 + 10) % 10))
    WHEN 'giallo' THEN GREATEST(yy - ((yy % 10 - 2 + 10) % 10), yy - ((yy % 10 - 7 + 10) % 10))
    WHEN 'rosso'  THEN GREATEST(yy - ((yy % 10 - 3 + 10) % 10), yy - ((yy % 10 - 8 + 10) % 10))
    WHEN 'verde'  THEN GREATEST(yy - ((yy % 10 - 4 + 10) % 10), yy - ((yy % 10 - 9 + 10) % 10))
    WHEN 'blu'    THEN GREATEST(yy - ((yy % 10 - 5 + 10) % 10), yy - ((yy % 10 - 0 + 10) % 10))
  END
  FROM y
)
WHERE q.birth_year IS NULL
  AND q.marking_color <> 'non_marcata';

-- 4. Aggiorna la RPC che crea arnia + prima regina: niente più marking_color.
--    La nuova regina nasce non marcata (is_marked default false).
CREATE OR REPLACE FUNCTION public.create_hive_with_queen(
  p_id               uuid,
  p_apiary_id        uuid,
  p_identifier       text,
  p_hive_type        public.hive_type,
  p_bee_race         public.bee_race,
  p_installed_on     date,
  p_origin_notes     text,
  p_nido_frame_count smallint,
  p_notes            text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM apiaries WHERE id = p_apiary_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  INSERT INTO hives (
    id, apiary_id, identifier, hive_type, bee_race,
    installed_on, origin_notes, nido_frame_count, notes
  ) VALUES (
    p_id, p_apiary_id, p_identifier, p_hive_type, p_bee_race,
    p_installed_on, p_origin_notes, p_nido_frame_count, p_notes
  );

  INSERT INTO queens (hive_id, origin, start_date)
  VALUES (p_id, 'sconosciuta', COALESCE(p_installed_on, CURRENT_DATE));
END;
$$;

-- NB: la colonna `marking_color` NON viene droppata qui di proposito.
-- Resta nel DB (ignorata dall'app) finché non si verifica che la conversione
-- dei dati (is_marked + birth_year) è corretta. Il DROP è in una migration
-- separata: supabase/migrations-pending/20260611000002_drop_queen_marking_color.sql
-- da promuovere in migrations/ e applicare solo dopo la verifica.
