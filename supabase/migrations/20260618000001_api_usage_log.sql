create table public.api_usage_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  service      text not null check (service in ('whisper', 'deepseek')),
  audio_seconds numeric(8,2),   -- whisper
  tokens_in    integer,         -- deepseek
  tokens_out   integer,         -- deepseek
  cost_usd     numeric(12,8) not null default 0
);

create index idx_api_usage_log_user on public.api_usage_log(user_id, created_at desc);
create index idx_api_usage_log_created on public.api_usage_log(created_at desc);

alter table public.api_usage_log enable row level security;

create policy "users can insert own usage"
  on public.api_usage_log for insert
  with check (auth.uid() = user_id);

create policy "users can read own usage"
  on public.api_usage_log for select
  using (auth.uid() = user_id);

create policy "admins can read all usage"
  on public.api_usage_log for select
  using (exists (select 1 from public.app_admins where user_id = auth.uid()));

-- Aggregazione per utente (admin only)
create or replace function public.get_api_cost_by_user()
returns table (
  user_id      uuid,
  display_name text,
  call_count   bigint,
  cost_usd     numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    l.user_id,
    coalesce(p.display_name, l.user_id::text) as display_name,
    count(*)::bigint as call_count,
    sum(l.cost_usd) as cost_usd
  from api_usage_log l
  left join profiles p on p.id = l.user_id
  group by l.user_id, p.display_name
  order by cost_usd desc;
$$;
