-- Fix storage RLS: estendi da owner-only a apiary_access (editor/reader)
-- Path convention: apiaries/{apiary_uuid}/main.{ext}

-- 1. Helper: estrai apiary_id dal path
CREATE OR REPLACE FUNCTION public.storage_get_apiary_id(object_name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (string_to_array(object_name, '/'))[2]::uuid;
$$;

-- 2. Helper SELECT: owner O qualsiasi utente con read access all'apiario
CREATE OR REPLACE FUNCTION public.storage_can_read_apiary_media(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.user_can_read_apiary(public.storage_get_apiary_id(object_name));
$$;

-- 3. Helper INSERT/UPDATE: owner O utente con write access all'apiario
CREATE OR REPLACE FUNCTION public.storage_can_write_apiary_media(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.user_can_write_apiary(public.storage_get_apiary_id(object_name));
$$;

-- 4. Helper DELETE: owner apiario O uploader del file
CREATE OR REPLACE FUNCTION public.storage_can_delete_apiary_media(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      public.user_owns_apiary(public.storage_get_apiary_id(object_name))
      OR EXISTS (
        SELECT 1 FROM storage.objects
        WHERE name = object_name
          AND bucket_id = 'apidiario-media'
          AND owner = auth.uid()
      )
    );
$$;

-- 5. Sostituisci policy storage
DROP POLICY IF EXISTS "owner read apiary media"   ON storage.objects;
DROP POLICY IF EXISTS "owner insert apiary media" ON storage.objects;
DROP POLICY IF EXISTS "owner update apiary media" ON storage.objects;
DROP POLICY IF EXISTS "owner delete apiary media" ON storage.objects;

CREATE POLICY "read apiary media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apidiario-media' AND public.storage_can_read_apiary_media(name));

CREATE POLICY "insert apiary media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apidiario-media' AND public.storage_can_write_apiary_media(name));

CREATE POLICY "update apiary media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_write_apiary_media(name));

CREATE POLICY "delete apiary media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_delete_apiary_media(name));

-- 6. Rimuovi vecchia funzione (non piu' usata)
DROP FUNCTION IF EXISTS public.storage_owns_apiary_media(text);
