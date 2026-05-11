drop extension if exists "pg_net";

drop trigger if exists "apiaries_set_timestamp" on "public"."apiaries";

drop trigger if exists "harvests_set_timestamp" on "public"."harvests";

drop trigger if exists "hives_set_timestamp" on "public"."hives";

drop trigger if exists "inspections_set_timestamp" on "public"."inspections";

drop trigger if exists "profiles_set_timestamp" on "public"."profiles";

drop trigger if exists "queens_set_timestamp" on "public"."queens";

drop trigger if exists "reminders_set_timestamp" on "public"."reminders";

drop trigger if exists "treatments_set_timestamp" on "public"."treatments";

drop policy "admins can read all logs" on "public"."activity_log";

drop policy "apiaries_delete" on "public"."apiaries";

drop policy "apiaries_select" on "public"."apiaries";

drop policy "apiaries_update" on "public"."apiaries";

drop policy "apiary_access_delete" on "public"."apiary_access";

drop policy "apiary_access_insert" on "public"."apiary_access";

drop policy "apiary_access_select" on "public"."apiary_access";

drop policy "apiary_access_update" on "public"."apiary_access";

drop policy "app_admins_delete" on "public"."app_admins";

drop policy "app_admins_insert" on "public"."app_admins";

drop policy "app_admins_select" on "public"."app_admins";

drop policy "harvests_delete" on "public"."harvests";

drop policy "harvests_insert" on "public"."harvests";

drop policy "harvests_select" on "public"."harvests";

drop policy "harvests_update" on "public"."harvests";

drop policy "hives_delete" on "public"."hives";

drop policy "hives_insert" on "public"."hives";

drop policy "hives_select" on "public"."hives";

drop policy "hives_update" on "public"."hives";

drop policy "voice_notes_delete" on "public"."inspection_voice_notes";

drop policy "voice_notes_insert" on "public"."inspection_voice_notes";

drop policy "voice_notes_select" on "public"."inspection_voice_notes";

drop policy "inspections_delete" on "public"."inspections";

drop policy "inspections_insert" on "public"."inspections";

drop policy "inspections_select" on "public"."inspections";

drop policy "inspections_update" on "public"."inspections";

drop policy "media_delete" on "public"."media";

drop policy "media_insert" on "public"."media";

drop policy "media_select" on "public"."media";

drop policy "queens_delete" on "public"."queens";

drop policy "queens_insert" on "public"."queens";

drop policy "queens_select" on "public"."queens";

drop policy "queens_update" on "public"."queens";

drop policy "treatment_hives_delete" on "public"."treatment_hives";

drop policy "treatment_hives_insert" on "public"."treatment_hives";

drop policy "treatment_hives_select" on "public"."treatment_hives";

drop policy "treatments_delete" on "public"."treatments";

drop policy "treatments_insert" on "public"."treatments";

drop policy "treatments_select" on "public"."treatments";

drop policy "treatments_update" on "public"."treatments";

alter table "public"."activity_log" drop constraint "activity_log_user_id_fkey";

alter table "public"."apiaries" drop constraint "apiaries_owner_id_fkey";

alter table "public"."apiary_access" drop constraint "apiary_access_apiary_id_fkey";

alter table "public"."apiary_access" drop constraint "apiary_access_granted_by_fkey";

alter table "public"."apiary_access" drop constraint "apiary_access_user_id_fkey";

alter table "public"."harvests" drop constraint "harvests_apiary_id_fkey";

alter table "public"."harvests" drop constraint "harvests_recorded_by_fkey";

alter table "public"."hives" drop constraint "hives_apiary_id_fkey";

alter table "public"."inspection_voice_notes" drop constraint "inspection_voice_notes_inspection_id_fkey";

alter table "public"."inspections" drop constraint "inspections_hive_id_fkey";

alter table "public"."inspections" drop constraint "inspections_performed_by_fkey";

alter table "public"."media" drop constraint "media_apiary_id_fkey";

alter table "public"."media" drop constraint "media_hive_id_fkey";

alter table "public"."media" drop constraint "media_inspection_id_fkey";

alter table "public"."media" drop constraint "media_uploaded_by_fkey";

alter table "public"."queens" drop constraint "queens_hive_id_fkey";

alter table "public"."reminders" drop constraint "reminders_apiary_id_fkey";

alter table "public"."reminders" drop constraint "reminders_check";

alter table "public"."reminders" drop constraint "reminders_hive_id_fkey";

alter table "public"."reminders" drop constraint "reminders_user_id_fkey";

alter table "public"."treatment_hives" drop constraint "treatment_hives_hive_id_fkey";

alter table "public"."treatment_hives" drop constraint "treatment_hives_treatment_id_fkey";

alter table "public"."treatments" drop constraint "treatments_apiary_id_fkey";

alter table "public"."treatments" drop constraint "treatments_performed_by_fkey";

drop function if exists "public"."create_hive_with_queen"(p_id uuid, p_apiary_id uuid, p_identifier text, p_hive_type hive_type, p_bee_race bee_race, p_installed_on date, p_origin_notes text, p_nido_frame_count smallint, p_notes text);

alter table "public"."apiary_access" alter column "role" set data type public.access_role using "role"::text::public.access_role;

alter table "public"."hives" alter column "bee_race" set default 'sconosciuta'::public.bee_race;

alter table "public"."hives" alter column "bee_race" set data type public.bee_race using "bee_race"::text::public.bee_race;

alter table "public"."hives" alter column "hive_type" set default 'dadant_blatt'::public.hive_type;

alter table "public"."hives" alter column "hive_type" set data type public.hive_type using "hive_type"::text::public.hive_type;

alter table "public"."hives" alter column "status" set default 'attiva'::public.hive_status;

alter table "public"."hives" alter column "status" set data type public.hive_status using "status"::text::public.hive_status;

alter table "public"."inspections" alter column "behavior" set data type public.behavior_type using "behavior"::text::public.behavior_type;

alter table "public"."inspections" alter column "pathologies" set data type public.pathology[] using "pathologies"::public.pathology[];

alter table "public"."inspections" alter column "population" set data type public.population_strength using "population"::text::public.population_strength;

alter table "public"."inspections" alter column "queen_cells" set data type public.queen_cells_type using "queen_cells"::text::public.queen_cells_type;

alter table "public"."inspections" alter column "queen_seen" set default 'non_cercata'::public.queen_seen_state;

alter table "public"."inspections" alter column "queen_seen" set data type public.queen_seen_state using "queen_seen"::text::public.queen_seen_state;

alter table "public"."inspections" alter column "varroa_count_method" set data type public.varroa_count_method using "varroa_count_method"::text::public.varroa_count_method;

alter table "public"."media" alter column "kind" set data type public.media_kind using "kind"::text::public.media_kind;

alter table "public"."queens" alter column "marking_color" set default 'non_marcata'::public.queen_marking_color;

alter table "public"."queens" alter column "marking_color" set data type public.queen_marking_color using "marking_color"::text::public.queen_marking_color;

alter table "public"."queens" alter column "origin" set default 'sconosciuta'::public.queen_origin;

alter table "public"."queens" alter column "origin" set data type public.queen_origin using "origin"::text::public.queen_origin;

alter table "public"."reminders" alter column "recurrence" set default 'none'::public.reminder_recurrence;

alter table "public"."reminders" alter column "recurrence" set data type public.reminder_recurrence using "recurrence"::text::public.reminder_recurrence;

alter table "public"."reminders" alter column "scope" set data type public.reminder_scope using "scope"::text::public.reminder_scope;

alter table "public"."activity_log" add constraint "activity_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."activity_log" validate constraint "activity_log_user_id_fkey";

alter table "public"."apiaries" add constraint "apiaries_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."apiaries" validate constraint "apiaries_owner_id_fkey";

alter table "public"."apiary_access" add constraint "apiary_access_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE CASCADE not valid;

alter table "public"."apiary_access" validate constraint "apiary_access_apiary_id_fkey";

alter table "public"."apiary_access" add constraint "apiary_access_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public.profiles(id) not valid;

alter table "public"."apiary_access" validate constraint "apiary_access_granted_by_fkey";

alter table "public"."apiary_access" add constraint "apiary_access_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."apiary_access" validate constraint "apiary_access_user_id_fkey";

alter table "public"."harvests" add constraint "harvests_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE RESTRICT not valid;

alter table "public"."harvests" validate constraint "harvests_apiary_id_fkey";

alter table "public"."harvests" add constraint "harvests_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) not valid;

alter table "public"."harvests" validate constraint "harvests_recorded_by_fkey";

alter table "public"."hives" add constraint "hives_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE RESTRICT not valid;

alter table "public"."hives" validate constraint "hives_apiary_id_fkey";

alter table "public"."inspection_voice_notes" add constraint "inspection_voice_notes_inspection_id_fkey" FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE not valid;

alter table "public"."inspection_voice_notes" validate constraint "inspection_voice_notes_inspection_id_fkey";

alter table "public"."inspections" add constraint "inspections_hive_id_fkey" FOREIGN KEY (hive_id) REFERENCES public.hives(id) ON DELETE CASCADE not valid;

alter table "public"."inspections" validate constraint "inspections_hive_id_fkey";

alter table "public"."inspections" add constraint "inspections_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES public.profiles(id) not valid;

alter table "public"."inspections" validate constraint "inspections_performed_by_fkey";

alter table "public"."media" add constraint "media_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_apiary_id_fkey";

alter table "public"."media" add constraint "media_hive_id_fkey" FOREIGN KEY (hive_id) REFERENCES public.hives(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_hive_id_fkey";

alter table "public"."media" add constraint "media_inspection_id_fkey" FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_inspection_id_fkey";

alter table "public"."media" add constraint "media_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) not valid;

alter table "public"."media" validate constraint "media_uploaded_by_fkey";

alter table "public"."queens" add constraint "queens_hive_id_fkey" FOREIGN KEY (hive_id) REFERENCES public.hives(id) ON DELETE CASCADE not valid;

alter table "public"."queens" validate constraint "queens_hive_id_fkey";

alter table "public"."reminders" add constraint "reminders_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE CASCADE not valid;

alter table "public"."reminders" validate constraint "reminders_apiary_id_fkey";

alter table "public"."reminders" add constraint "reminders_check" CHECK ((((scope = 'global'::public.reminder_scope) AND (apiary_id IS NULL) AND (hive_id IS NULL)) OR ((scope = 'apiary'::public.reminder_scope) AND (apiary_id IS NOT NULL) AND (hive_id IS NULL)) OR ((scope = 'hive'::public.reminder_scope) AND (hive_id IS NOT NULL)))) not valid;

alter table "public"."reminders" validate constraint "reminders_check";

alter table "public"."reminders" add constraint "reminders_hive_id_fkey" FOREIGN KEY (hive_id) REFERENCES public.hives(id) ON DELETE CASCADE not valid;

alter table "public"."reminders" validate constraint "reminders_hive_id_fkey";

alter table "public"."reminders" add constraint "reminders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reminders" validate constraint "reminders_user_id_fkey";

alter table "public"."treatment_hives" add constraint "treatment_hives_hive_id_fkey" FOREIGN KEY (hive_id) REFERENCES public.hives(id) ON DELETE RESTRICT not valid;

alter table "public"."treatment_hives" validate constraint "treatment_hives_hive_id_fkey";

alter table "public"."treatment_hives" add constraint "treatment_hives_treatment_id_fkey" FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE CASCADE not valid;

alter table "public"."treatment_hives" validate constraint "treatment_hives_treatment_id_fkey";

alter table "public"."treatments" add constraint "treatments_apiary_id_fkey" FOREIGN KEY (apiary_id) REFERENCES public.apiaries(id) ON DELETE RESTRICT not valid;

alter table "public"."treatments" validate constraint "treatments_apiary_id_fkey";

alter table "public"."treatments" add constraint "treatments_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES public.profiles(id) not valid;

alter table "public"."treatments" validate constraint "treatments_performed_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_hive_with_queen(p_id uuid, p_apiary_id uuid, p_identifier text, p_hive_type public.hive_type, p_bee_race public.bee_race, p_installed_on date, p_origin_notes text, p_nido_frame_count smallint, p_notes text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM apiaries WHERE id = p_apiary_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  INSERT INTO hives (
    id, apiary_id, identifier, hive_type, bee_race,
    installed_on, origin_notes, nido_frame_count, notes
  ) VALUES (
    p_id, p_apiary_id, p_identifier, p_hive_type, p_bee_race,
    p_installed_on, p_origin_notes, p_nido_frame_count, p_notes
  );

  INSERT INTO queens (hive_id, marking_color, origin, start_date)
  VALUES (p_id, 'non_marcata', 'sconosciuta', COALESCE(p_installed_on, CURRENT_DATE));
END;
$function$
;


  create policy "admins can read all logs"
  on "public"."activity_log"
  as permissive
  for select
  to public
using (public.is_app_admin());



  create policy "apiaries_delete"
  on "public"."apiaries"
  as permissive
  for delete
  to public
using (public.user_owns_apiary(id));



  create policy "apiaries_select"
  on "public"."apiaries"
  as permissive
  for select
  to public
using (public.user_can_read_apiary(id));



  create policy "apiaries_update"
  on "public"."apiaries"
  as permissive
  for update
  to public
using (public.user_can_write_apiary(id))
with check (public.user_can_write_apiary(id));



  create policy "apiary_access_delete"
  on "public"."apiary_access"
  as permissive
  for delete
  to public
using (public.user_owns_apiary(apiary_id));



  create policy "apiary_access_insert"
  on "public"."apiary_access"
  as permissive
  for insert
  to public
with check (public.user_owns_apiary(apiary_id));



  create policy "apiary_access_select"
  on "public"."apiary_access"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR public.user_owns_apiary(apiary_id)));



  create policy "apiary_access_update"
  on "public"."apiary_access"
  as permissive
  for update
  to public
using (public.user_owns_apiary(apiary_id))
with check (public.user_owns_apiary(apiary_id));



  create policy "app_admins_delete"
  on "public"."app_admins"
  as permissive
  for delete
  to public
using (public.is_app_admin());



  create policy "app_admins_insert"
  on "public"."app_admins"
  as permissive
  for insert
  to public
with check (public.is_app_admin());



  create policy "app_admins_select"
  on "public"."app_admins"
  as permissive
  for select
  to public
using (public.is_app_admin());



  create policy "harvests_delete"
  on "public"."harvests"
  as permissive
  for delete
  to public
using (((recorded_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)));



  create policy "harvests_insert"
  on "public"."harvests"
  as permissive
  for insert
  to public
with check ((public.user_can_write_apiary(apiary_id) AND (recorded_by = auth.uid())));



  create policy "harvests_select"
  on "public"."harvests"
  as permissive
  for select
  to public
using (public.user_can_read_apiary(apiary_id));



  create policy "harvests_update"
  on "public"."harvests"
  as permissive
  for update
  to public
using (((recorded_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)))
with check (((recorded_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)));



  create policy "hives_delete"
  on "public"."hives"
  as permissive
  for delete
  to public
using (public.user_owns_apiary(apiary_id));



  create policy "hives_insert"
  on "public"."hives"
  as permissive
  for insert
  to public
with check (public.user_can_write_apiary(apiary_id));



  create policy "hives_select"
  on "public"."hives"
  as permissive
  for select
  to public
using (public.user_can_read_hive(id));



  create policy "hives_update"
  on "public"."hives"
  as permissive
  for update
  to public
using (public.user_can_write_hive(id))
with check (public.user_can_write_hive(id));



  create policy "voice_notes_delete"
  on "public"."inspection_voice_notes"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.inspections i
  WHERE ((i.id = inspection_voice_notes.inspection_id) AND public.user_can_write_hive(i.hive_id)))));



  create policy "voice_notes_insert"
  on "public"."inspection_voice_notes"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.inspections i
  WHERE ((i.id = inspection_voice_notes.inspection_id) AND public.user_can_write_hive(i.hive_id)))));



  create policy "voice_notes_select"
  on "public"."inspection_voice_notes"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.inspections i
  WHERE ((i.id = inspection_voice_notes.inspection_id) AND public.user_can_read_hive(i.hive_id)))));



  create policy "inspections_delete"
  on "public"."inspections"
  as permissive
  for delete
  to public
using (((performed_by = auth.uid()) AND public.user_can_write_hive(hive_id)));



  create policy "inspections_insert"
  on "public"."inspections"
  as permissive
  for insert
  to public
with check ((public.user_can_write_hive(hive_id) AND (performed_by = auth.uid())));



  create policy "inspections_select"
  on "public"."inspections"
  as permissive
  for select
  to public
using (public.user_can_read_hive(hive_id));



  create policy "inspections_update"
  on "public"."inspections"
  as permissive
  for update
  to public
using (((performed_by = auth.uid()) AND public.user_can_write_hive(hive_id)))
with check (((performed_by = auth.uid()) AND public.user_can_write_hive(hive_id)));



  create policy "media_delete"
  on "public"."media"
  as permissive
  for delete
  to public
using (((uploaded_by = auth.uid()) OR
CASE
    WHEN (apiary_id IS NOT NULL) THEN public.user_owns_apiary(apiary_id)
    WHEN (hive_id IS NOT NULL) THEN (EXISTS ( SELECT 1
       FROM public.hives h
      WHERE ((h.id = media.hive_id) AND public.user_owns_apiary(h.apiary_id))))
    WHEN (inspection_id IS NOT NULL) THEN (EXISTS ( SELECT 1
       FROM (public.inspections i
         JOIN public.hives h ON ((h.id = i.hive_id)))
      WHERE ((i.id = media.inspection_id) AND public.user_owns_apiary(h.apiary_id))))
    ELSE false
END));



  create policy "media_insert"
  on "public"."media"
  as permissive
  for insert
  to public
with check (((uploaded_by = auth.uid()) AND
CASE
    WHEN (apiary_id IS NOT NULL) THEN public.user_can_write_apiary(apiary_id)
    WHEN (hive_id IS NOT NULL) THEN public.user_can_write_hive(hive_id)
    WHEN (inspection_id IS NOT NULL) THEN (EXISTS ( SELECT 1
       FROM public.inspections i
      WHERE ((i.id = media.inspection_id) AND public.user_can_write_hive(i.hive_id))))
    ELSE false
END));



  create policy "media_select"
  on "public"."media"
  as permissive
  for select
  to public
using (
CASE
    WHEN (apiary_id IS NOT NULL) THEN public.user_can_read_apiary(apiary_id)
    WHEN (hive_id IS NOT NULL) THEN public.user_can_read_hive(hive_id)
    WHEN (inspection_id IS NOT NULL) THEN (EXISTS ( SELECT 1
       FROM public.inspections i
      WHERE ((i.id = media.inspection_id) AND public.user_can_read_hive(i.hive_id))))
    ELSE false
END);



  create policy "queens_delete"
  on "public"."queens"
  as permissive
  for delete
  to public
using (public.user_can_write_hive(hive_id));



  create policy "queens_insert"
  on "public"."queens"
  as permissive
  for insert
  to public
with check (public.user_can_write_hive(hive_id));



  create policy "queens_select"
  on "public"."queens"
  as permissive
  for select
  to public
using (public.user_can_read_hive(hive_id));



  create policy "queens_update"
  on "public"."queens"
  as permissive
  for update
  to public
using (public.user_can_write_hive(hive_id))
with check (public.user_can_write_hive(hive_id));



  create policy "treatment_hives_delete"
  on "public"."treatment_hives"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.treatments t
  WHERE ((t.id = treatment_hives.treatment_id) AND (t.performed_by = auth.uid())))));



  create policy "treatment_hives_insert"
  on "public"."treatment_hives"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM public.treatments t
  WHERE ((t.id = treatment_hives.treatment_id) AND public.user_can_write_apiary(t.apiary_id)))) AND public.user_can_write_hive(hive_id)));



  create policy "treatment_hives_select"
  on "public"."treatment_hives"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.treatments t
  WHERE ((t.id = treatment_hives.treatment_id) AND public.user_can_read_apiary(t.apiary_id)))));



  create policy "treatments_delete"
  on "public"."treatments"
  as permissive
  for delete
  to public
using (((performed_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)));



  create policy "treatments_insert"
  on "public"."treatments"
  as permissive
  for insert
  to public
with check ((public.user_can_write_apiary(apiary_id) AND (performed_by = auth.uid())));



  create policy "treatments_select"
  on "public"."treatments"
  as permissive
  for select
  to public
using (public.user_can_read_apiary(apiary_id));



  create policy "treatments_update"
  on "public"."treatments"
  as permissive
  for update
  to public
using (((performed_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)))
with check (((performed_by = auth.uid()) AND public.user_can_write_apiary(apiary_id)));


CREATE TRIGGER apiaries_set_timestamp BEFORE UPDATE ON public.apiaries FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER harvests_set_timestamp BEFORE UPDATE ON public.harvests FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER hives_set_timestamp BEFORE UPDATE ON public.hives FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER inspections_set_timestamp BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER profiles_set_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER queens_set_timestamp BEFORE UPDATE ON public.queens FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER reminders_set_timestamp BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER treatments_set_timestamp BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

drop policy "delete apiary media" on "storage"."objects";

drop policy "insert apiary media" on "storage"."objects";

drop policy "read apiary media" on "storage"."objects";

drop policy "update apiary media" on "storage"."objects";


  create policy "delete apiary media"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'apidiario-media'::text) AND public.storage_can_delete_apiary_media(name)));



  create policy "insert apiary media"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'apidiario-media'::text) AND public.storage_can_write_apiary_media(name)));



  create policy "read apiary media"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'apidiario-media'::text) AND public.storage_can_read_apiary_media(name)));



  create policy "update apiary media"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'apidiario-media'::text) AND public.storage_can_write_apiary_media(name)));



