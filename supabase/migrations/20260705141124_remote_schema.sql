alter table "public"."inspections" add column "queen_cell_types" jsonb not null default '[]'::jsonb;

alter table "public"."profiles" add column "onboarding_completed" boolean not null default false;

alter table "public"."user_inspection_preferences" alter column "express_fields" set default '["queen", "hasBrood", "population", "hasQueenCells", "notes"]'::jsonb;


