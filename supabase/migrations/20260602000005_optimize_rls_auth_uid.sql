-- Wrap auth.uid() in subquery (select auth.uid()) so pg evaluates it
-- once per query, not once per row. Supabase dashboard flags this.

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using ((select auth.uid()) is not null);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- apiaries
drop policy if exists apiaries_insert on public.apiaries;
create policy apiaries_insert on public.apiaries
  for insert with check (owner_id = (select auth.uid()));

-- apiary_access
drop policy if exists apiary_access_select on public.apiary_access;
create policy apiary_access_select on public.apiary_access
  for select using (
    user_id = (select auth.uid())
    or public.user_owns_apiary(apiary_id)
  );

-- inspections
drop policy if exists inspections_insert on public.inspections;
create policy inspections_insert on public.inspections
  for insert with check (
    public.user_can_write_hive(hive_id)
    and performed_by = (select auth.uid())
  );

drop policy if exists inspections_update on public.inspections;
create policy inspections_update on public.inspections
  for update using (
    performed_by = (select auth.uid())
    and public.user_can_write_hive(hive_id)
  ) with check (
    performed_by = (select auth.uid())
    and public.user_can_write_hive(hive_id)
  );

drop policy if exists inspections_delete on public.inspections;
create policy inspections_delete on public.inspections
  for delete using (
    exists (
      select 1 from hives h
      join apiaries a on a.id = h.apiary_id
      where h.id = inspections.hive_id
        and a.owner_id = (select auth.uid())
    )
    or (
      performed_by = (select auth.uid())
      and public.user_can_write_hive(hive_id)
    )
  );

-- treatments
drop policy if exists treatments_insert on public.treatments;
create policy treatments_insert on public.treatments
  for insert with check (
    public.user_can_write_apiary(apiary_id)
    and performed_by = (select auth.uid())
  );

drop policy if exists treatments_update on public.treatments;
create policy treatments_update on public.treatments
  for update using (
    performed_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  ) with check (
    performed_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  );

drop policy if exists treatments_delete on public.treatments;
create policy treatments_delete on public.treatments
  for delete using (
    performed_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  );

-- treatment_hives
drop policy if exists treatment_hives_delete on public.treatment_hives;
create policy treatment_hives_delete on public.treatment_hives
  for delete using (
    exists (
      select 1 from treatments t
      where t.id = treatment_hives.treatment_id
        and t.performed_by = (select auth.uid())
    )
  );

-- harvests
drop policy if exists harvests_insert on public.harvests;
create policy harvests_insert on public.harvests
  for insert with check (
    public.user_can_write_apiary(apiary_id)
    and recorded_by = (select auth.uid())
  );

drop policy if exists harvests_update on public.harvests;
create policy harvests_update on public.harvests
  for update using (
    recorded_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  ) with check (
    recorded_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  );

drop policy if exists harvests_delete on public.harvests;
create policy harvests_delete on public.harvests
  for delete using (
    recorded_by = (select auth.uid())
    and public.user_can_write_apiary(apiary_id)
  );

-- reminders
drop policy if exists reminders_all on public.reminders;
create policy reminders_all on public.reminders
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- media
drop policy if exists media_insert on public.media;
create policy media_insert on public.media
  for insert with check (
    uploaded_by = (select auth.uid())
    and case
      when apiary_id     is not null then public.user_can_write_apiary(apiary_id)
      when hive_id       is not null then public.user_can_write_hive(hive_id)
      when inspection_id is not null then exists (
        select 1 from inspections i
        where i.id = media.inspection_id
          and public.user_can_write_hive(i.hive_id)
      )
      else false
    end
  );

drop policy if exists media_delete on public.media;
create policy media_delete on public.media
  for delete using (
    uploaded_by = (select auth.uid())
    or case
      when apiary_id     is not null then public.user_owns_apiary(apiary_id)
      when hive_id       is not null then exists (
        select 1 from hives h
        where h.id = media.hive_id
          and public.user_owns_apiary(h.apiary_id)
      )
      when inspection_id is not null then exists (
        select 1 from inspections i
        join hives h on h.id = i.hive_id
        where i.id = media.inspection_id
          and public.user_owns_apiary(h.apiary_id)
      )
      else false
    end
  );

-- bloom_observations
drop policy if exists "users can read own observations" on bloom_observations;
create policy "users can read own observations"
  on bloom_observations
  for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from apiary_access
      where apiary_access.apiary_id = bloom_observations.apiary_id
      and apiary_access.user_id = (select auth.uid())
    )
  );

drop policy if exists "users can insert own observations" on bloom_observations;
create policy "users can insert own observations"
  on bloom_observations
  for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "users can update own observations" on bloom_observations;
create policy "users can update own observations"
  on bloom_observations
  for update
  using (user_id = (select auth.uid()));

drop policy if exists "users can delete own observations" on bloom_observations;
create policy "users can delete own observations"
  on bloom_observations
  for delete
  using (user_id = (select auth.uid()));

-- push_subscriptions
drop policy if exists "users_manage_own_subscriptions" on public.push_subscriptions;
create policy "users_manage_own_subscriptions" on public.push_subscriptions
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
