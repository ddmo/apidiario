-- Storage RLS policies for hive media (hives/{hive_id}/... paths)

-- 1. Helper READ: user can read hive
CREATE OR REPLACE FUNCTION public.storage_can_read_hive_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  hive_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'hives' THEN
    RETURN FALSE;
  END IF;
  hive_id := parts[2]::uuid;
  RETURN public.user_can_read_hive(hive_id);
END;
$$;

-- 2. Helper WRITE: user can write hive
CREATE OR REPLACE FUNCTION public.storage_can_write_hive_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  hive_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'hives' THEN
    RETURN FALSE;
  END IF;
  hive_id := parts[2]::uuid;
  RETURN public.user_can_write_hive(hive_id);
END;
$$;

-- 3. Helper DELETE: owner of the apiary that owns the hive
CREATE OR REPLACE FUNCTION public.storage_can_delete_hive_media(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  hive_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');
  IF parts[1] != 'hives' THEN
    RETURN FALSE;
  END IF;
  hive_id := parts[2]::uuid;
  RETURN EXISTS (
    SELECT 1 FROM hives h
    JOIN apiaries a ON a.id = h.apiary_id
    WHERE h.id = hive_id
      AND a.owner_id = (select auth.uid())
  );
END;
$$;

-- 4. Storage policies for hive media
CREATE POLICY "read hive media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apidiario-media' AND public.storage_can_read_hive_media(name));

CREATE POLICY "insert hive media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apidiario-media' AND public.storage_can_write_hive_media(name));

CREATE POLICY "update hive media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_write_hive_media(name));

CREATE POLICY "delete hive media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'apidiario-media' AND public.storage_can_delete_hive_media(name));
