ALTER TABLE public.treatments
ADD COLUMN applies_to_all_hives boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.treatments.applies_to_all_hives IS
  'Quando true, il trattamento si applica a tutte le arnie attive dell''apiario. Non vengono usate righe in treatment_hives.';
