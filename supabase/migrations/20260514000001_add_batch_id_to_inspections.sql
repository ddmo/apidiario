ALTER TABLE inspections
  ADD COLUMN batch_id uuid;

CREATE INDEX idx_inspections_batch_id ON inspections(batch_id)
  WHERE batch_id IS NOT NULL;
