-- Storage RLS per inspection media (percorsi inspections/{uuid}/media/{uuid}.{ext})
-- Le policy esistenti gestiscono solo apiaries/{uuid}/main.{ext}

-- Helper SELECT/INSERT: verifica accesso hive attraverso inspection_id nel path
CREATE OR REPLACE FUNCTION public.storage_can_read_inspection_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  insp_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'inspections' THEN
    RETURN FALSE;
  END IF;
  insp_id := parts[2]::uuid;
  RETURN auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM inspections i
      JOIN hives h ON h.id = i.hive_id
      WHERE i.id = insp_id
        AND public.user_can_read_hive(h.id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_can_write_inspection_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  insp_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'inspections' THEN
    RETURN FALSE;
  END IF;
  insp_id := parts[2]::uuid;
  RETURN auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM inspections i
      JOIN hives h ON h.id = i.hive_id
      WHERE i.id = insp_id
        AND public.user_can_write_hive(h.id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_can_delete_inspection_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  insp_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'inspections' THEN
    RETURN FALSE;
  END IF;
  insp_id := parts[2]::uuid;
  RETURN auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM inspections i
        JOIN hives h ON h.id = i.hive_id
        WHERE i.id = insp_id
          AND public.user_can_write_hive(h.id)
      )
      OR EXISTS (
        SELECT 1 FROM storage.objects
        WHERE name = object_name
          AND bucket_id = 'apidiario-media'
          AND owner = auth.uid()
      )
    );
END;
$$;

-- Policy per inspection media (additive: OR con policy esistenti)
CREATE POLICY "read inspection media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apidiario-media' AND public.storage_can_read_inspection_media(name));

CREATE POLICY "insert inspection media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apidiario-media' AND public.storage_can_write_inspection_media(name));

CREATE POLICY "update inspection media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_write_inspection_media(name));

CREATE POLICY "delete inspection media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_delete_inspection_media(name));
