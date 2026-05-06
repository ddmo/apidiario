create policy "owner delete apiary media"
  on storage.objects for delete
  using (
    bucket_id = 'apidiario-media'
    and auth.uid() = (
      select owner_id from public.apiaries
      where id::text = (string_to_array(name, '/'))[2]
    )
  );
