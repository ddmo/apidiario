-- SECURITY DEFINER helper: check storage path ownership without triggering apiaries RLS.
-- Path convention: apiaries/{apiary_uuid}/main.{ext}
CREATE OR REPLACE FUNCTION public.storage_owns_apiary_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM apiaries
       WHERE id::text = (string_to_array(object_name, '/'))[2]
         AND owner_id = auth.uid()
    )
  );
END;
$$;

DROP POLICY IF EXISTS "owner read apiary media"   ON storage.objects;
DROP POLICY IF EXISTS "owner insert apiary media" ON storage.objects;
DROP POLICY IF EXISTS "owner update apiary media" ON storage.objects;
DROP POLICY IF EXISTS "owner delete apiary media" ON storage.objects;

CREATE POLICY "owner read apiary media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apidiario-media' AND public.storage_owns_apiary_media(name));

CREATE POLICY "owner insert apiary media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apidiario-media' AND public.storage_owns_apiary_media(name));

CREATE POLICY "owner update apiary media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'apidiario-media' AND public.storage_owns_apiary_media(name));

CREATE POLICY "owner delete apiary media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'apidiario-media' AND public.storage_owns_apiary_media(name));
