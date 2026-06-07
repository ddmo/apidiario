-- Replace queen_cells enum column with has_queen_cells toggle + two jsonb arrays
-- removed = celle tolte/distrutte (indice febbre sciamatoria)
-- remaining = celle lasciate (sostituzione/orfana)
alter table public.inspections
  add column has_queen_cells boolean not null default false,
  add column queen_cells_removed jsonb not null default '[]'::jsonb,
  add column queen_cells_remaining jsonb not null default '[]'::jsonb,
  drop column queen_cells;
