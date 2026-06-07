-- Admin-only statistics functions

-- Active user counts (7d and 30d) from activity_log
create or replace function public.get_active_user_counts()
returns table(active_7d bigint, active_30d bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(distinct case when created_at >= now() - interval '7 days' then user_id end) as active_7d,
    count(distinct case when created_at >= now() - interval '30 days' then user_id end) as active_30d
  from activity_log
  where created_at >= now() - interval '30 days';
$$;

revoke execute on function public.get_active_user_counts from public, anon, authenticated;
grant execute on function public.get_active_user_counts to authenticated;

-- Weekly inspection counts for the last N weeks
create or replace function public.get_weekly_inspection_counts(weeks_back int default 8)
returns table(week_start date, count bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('week', performed_at)::date as week_start,
    count(*) as count
  from inspections
  where performed_at >= date_trunc('week', now()) - ((weeks_back - 1) * interval '1 week')
  group by date_trunc('week', performed_at)
  order by week_start;
$$;

revoke execute on function public.get_weekly_inspection_counts from public, anon, authenticated;
grant execute on function public.get_weekly_inspection_counts to authenticated;

-- Per-user activity stats
create or replace function public.get_user_activity_stats()
returns table(
  user_id uuid,
  display_name text,
  inspection_count bigint,
  last_inspection_at timestamptz,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.display_name,
    count(distinct i.id) as inspection_count,
    max(i.performed_at) as last_inspection_at,
    max(al.created_at) as last_active_at
  from profiles p
  left join inspections i on i.performed_by = p.id
  left join activity_log al on al.user_id = p.id
  group by p.id, p.display_name
  order by last_active_at desc nulls last
  limit 50;
$$;

revoke execute on function public.get_user_activity_stats from public, anon, authenticated;
grant execute on function public.get_user_activity_stats to authenticated;
