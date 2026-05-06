# Storage setup — apidiario-media

Supabase does not expose bucket creation via SQL migrations.
Create the bucket once via the Supabase dashboard (or CLI).

## Create the bucket

### Via dashboard
1. Open Supabase Studio → Storage.
2. Click "New bucket".
3. Name: `apidiario-media`.
4. Toggle **Public bucket**: OFF (private).
5. Save.

### Via CLI (alternative)
```bash
npx supabase storage create apidiario-media --no-public
```

## Storage policies

After creating the bucket, run the following SQL in the Supabase SQL editor
(or add as a new migration if Supabase adds SQL support for storage policies).

```sql
-- Allow authenticated users to read objects they own (by apiary).
-- Path convention: apiaries/{apiary_id}/main.{ext}

-- SELECT: owner can read their own apiary photos
create policy "owner read apiary media"
  on storage.objects for select
  using (
    bucket_id = 'apidiario-media'
    and auth.uid() = (
      select owner_id from public.apiaries
      where id::text = (string_to_array(name, '/'))[2]
    )
  );

-- INSERT: owner can upload to their own apiary path
create policy "owner insert apiary media"
  on storage.objects for insert
  with check (
    bucket_id = 'apidiario-media'
    and auth.uid() = (
      select owner_id from public.apiaries
      where id::text = (string_to_array(name, '/'))[2]
    )
  );

-- UPDATE (upsert): owner can replace their own photo
create policy "owner update apiary media"
  on storage.objects for update
  using (
    bucket_id = 'apidiario-media'
    and auth.uid() = (
      select owner_id from public.apiaries
      where id::text = (string_to_array(name, '/'))[2]
    )
  );

-- DELETE: owner can delete their own photo
create policy "owner delete apiary media"
  on storage.objects for delete
  using (
    bucket_id = 'apidiario-media'
    and auth.uid() = (
      select owner_id from public.apiaries
      where id::text = (string_to_array(name, '/'))[2]
    )
  );
```

## Path convention

All apiary media is stored as:
```
apiaries/{apiary_uuid}/main.{ext}
```

The `main_photo_path` column in `public.apiaries` stores this relative path.
Signed URLs (1h TTL) are generated client-side via `supabase.storage.createSignedUrls()`.
