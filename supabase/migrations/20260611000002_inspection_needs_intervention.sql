-- Visita: flag "Necessario intervento". Quando l'ultima visita di un'arnia
-- ha needs_intervention = true, l'arnia va evidenziata e ordinata per prima
-- nell'elenco dell'apiario (logica lato app).

ALTER TABLE public.inspections
  ADD COLUMN needs_intervention boolean NOT NULL DEFAULT false;
