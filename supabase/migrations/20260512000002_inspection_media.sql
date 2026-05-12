-- Photo/video attachments for inspections

CREATE TABLE IF NOT EXISTS inspection_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_media_inspection ON inspection_media(inspection_id);

ALTER TABLE inspection_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY inspection_media_select ON inspection_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_media.inspection_id
    AND public.user_can_read_hive(i.hive_id)
  ));

CREATE POLICY inspection_media_insert ON inspection_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_media.inspection_id
    AND public.user_can_write_hive(i.hive_id)
  ));

CREATE POLICY inspection_media_delete ON inspection_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_media.inspection_id
    AND public.user_can_write_hive(i.hive_id)
  ));
