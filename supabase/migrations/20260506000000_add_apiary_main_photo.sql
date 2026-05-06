-- Add main_photo_path to apiaries table.
-- Stores the Storage path (bucket: apidiario-media, path: apiaries/{id}/main.{ext}).
-- URL resolution happens client-side via createSignedUrl.

alter table public.apiaries
  add column if not exists main_photo_path text;
