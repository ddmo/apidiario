-- Atomic RPC: inserts hive + its first queen in a single transaction.
-- SECURITY DEFINER so we can bypass RLS for both tables; ownership
-- is verified explicitly before any INSERT.
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

  INSERT INTO queens (hive_id, marking_color, origin, start_date)
  VALUES (p_id, 'non_marcata', 'sconosciuta', COALESCE(p_installed_on, CURRENT_DATE));
END;
$$;
