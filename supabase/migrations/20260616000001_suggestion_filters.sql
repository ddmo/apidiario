alter table public.user_inspection_preferences
  add column if not exists suggestion_filters jsonb;
