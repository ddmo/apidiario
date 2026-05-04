-- Allow NULL for queen_cells and pathologies so Express mode inspections
-- can record "not observed" (NULL) vs "none observed" (default value).
alter table inspections
  alter column queen_cells drop not null,
  alter column queen_cells drop default,
  alter column pathologies drop not null,
  alter column pathologies drop default;
