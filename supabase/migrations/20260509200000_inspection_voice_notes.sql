-- Voice notes for inspections
-- Each inspection can have multiple voice recordings.

CREATE TABLE IF NOT EXISTS inspection_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  duration_seconds numeric(6,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_notes_inspection ON inspection_voice_notes(inspection_id);

ALTER TABLE inspection_voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY voice_notes_select ON inspection_voice_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_voice_notes.inspection_id
    AND public.user_can_read_hive(i.hive_id)
  ));

CREATE POLICY voice_notes_insert ON inspection_voice_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_voice_notes.inspection_id
    AND public.user_can_write_hive(i.hive_id)
  ));

CREATE POLICY voice_notes_delete ON inspection_voice_notes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_voice_notes.inspection_id
    AND public.user_can_write_hive(i.hive_id)
  ));
