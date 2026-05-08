-- Phenology & GDD-based bloom prediction

-- ── Species reference table ────────────────────────────────────

CREATE TABLE phenology_species (
  id text PRIMARY KEY,
  common_name_it text NOT NULL,
  scientific_name text NOT NULL,
  gdd_bloom_start numeric NOT NULL,
  gdd_bloom_peak numeric NOT NULL,
  gdd_bloom_end numeric NOT NULL,
  bloom_period_text text,
  honey_relevance int CHECK (honey_relevance BETWEEN 1 AND 5),
  produces_honey boolean DEFAULT true,
  produces_pollen boolean DEFAULT true,
  notes_it text
);

INSERT INTO phenology_species VALUES
('mandorlo', 'Mandorlo', 'Prunus dulcis', 150, 200, 280, 'feb-mar', 3, false, true, 'Importante per polline precoce'),
('salice', 'Salice', 'Salix spp.', 180, 240, 320, 'marzo', 4, true, true, 'Polline e nettare di inizio stagione'),
('pesco', 'Pesco', 'Prunus persica', 240, 290, 370, 'marzo', 3, true, true, NULL),
('ciliegio', 'Ciliegio', 'Prunus avium', 280, 340, 420, 'marzo-aprile', 4, true, true, NULL),
('tarassaco', 'Tarassaco', 'Taraxacum officinale', 250, 350, 500, 'aprile-maggio', 4, true, true, 'Fioritura prolungata'),
('erica_arborea', 'Erica arborea', 'Erica arborea', 200, 280, 400, 'marzo-aprile', 4, true, true, 'Tipica zone costiere e maremmane'),
('colza', 'Colza', 'Brassica napus', 350, 450, 600, 'aprile', 4, true, true, NULL),
('acero', 'Acero', 'Acer spp.', 320, 400, 520, 'aprile', 3, true, true, NULL),
('biancospino', 'Biancospino', 'Crataegus monogyna', 420, 500, 620, 'aprile-maggio', 3, true, true, NULL),
('robinia', 'Robinia (acacia)', 'Robinia pseudoacacia', 540, 640, 780, 'maggio', 5, true, true, 'Miele monoflora pregiato'),
('sulla', 'Sulla', 'Hedysarum coronarium', 580, 700, 880, 'maggio', 5, true, true, 'Centro-sud Italia'),
('ailanto', 'Ailanto', 'Ailanthus altissima', 700, 820, 980, 'giugno', 3, true, true, 'Specie invasiva ma melifera'),
('tiglio_cordata', 'Tiglio selvatico', 'Tilia cordata', 720, 850, 1020, 'giugno', 5, true, true, NULL),
('tiglio_platyphyllos', 'Tiglio nostrano', 'Tilia platyphyllos', 680, 800, 970, 'giugno', 5, true, true, NULL),
('castagno', 'Castagno', 'Castanea sativa', 950, 1100, 1300, 'giugno-luglio', 5, true, true, 'Miele tipico aree montane'),
('rovo', 'Rovo', 'Rubus spp.', 700, 900, 1200, 'giugno-luglio', 4, true, true, 'Spesso usato in millefiori'),
('lavanda', 'Lavanda', 'Lavandula angustifolia', 950, 1150, 1450, 'giugno-luglio', 4, true, true, NULL),
('erba_medica', 'Erba medica', 'Medicago sativa', 850, 1050, 1350, 'giugno-settembre', 4, true, true, 'Fioritura multipla post-sfalcio'),
('girasole', 'Girasole', 'Helianthus annuus', 1100, 1300, 1550, 'luglio', 5, true, true, 'Dipende da data semina'),
('eucalipto', 'Eucalipto', 'Eucalyptus spp.', 1200, 1450, 1750, 'luglio-agosto', 4, true, true, 'Soprattutto centro-sud'),
('metcalfa', 'Melata di metcalfa', 'Metcalfa pruinosa', 1400, 1600, 1900, 'luglio-agosto', 4, true, false, 'Produzione di melata da insetto'),
('edera', 'Edera', 'Hedera helix', 2400, 2600, 2850, 'settembre-ottobre', 4, true, true, 'Apporto pre-invernale'),
('corbezzolo', 'Corbezzolo', 'Arbutus unedo', 2600, 2850, 3100, 'ottobre-novembre', 5, true, true, 'Miele amaro, ultimo della stagione');

CREATE INDEX idx_species_bloom_start ON phenology_species(gdd_bloom_start);

-- ── Daily weather per apiary ───────────────────────────────────

CREATE TABLE daily_weather (
  apiary_id uuid NOT NULL REFERENCES apiaries(id) ON DELETE CASCADE,
  date date NOT NULL,
  tmin numeric NOT NULL,
  tmax numeric NOT NULL,
  source text NOT NULL DEFAULT 'open-meteo',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (apiary_id, date)
);

CREATE INDEX idx_weather_apiary_date ON daily_weather(apiary_id, date DESC);

-- ── Materialized view: cumulative GDD ──────────────────────────

CREATE MATERIALIZED VIEW apiary_gdd_cumulative AS
SELECT
  apiary_id,
  date,
  EXTRACT(YEAR FROM date)::int AS year,
  GREATEST(0, (LEAST(tmax, 30) + LEAST(tmin, 30)) / 2.0 - 5.0) AS gdd_daily,
  SUM(GREATEST(0, (LEAST(tmax, 30) + LEAST(tmin, 30)) / 2.0 - 5.0))
    OVER (
      PARTITION BY apiary_id, EXTRACT(YEAR FROM date)
      ORDER BY date
    ) AS gdd_cumulative
FROM daily_weather;

CREATE UNIQUE INDEX idx_gdd_cum ON apiary_gdd_cumulative(apiary_id, date);

-- ── RLS: users can read weather for their own apiaries ─────────

ALTER TABLE daily_weather ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_can_read_own_weather ON daily_weather;
CREATE POLICY user_can_read_own_weather ON daily_weather
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apiaries
      WHERE apiaries.id = daily_weather.apiary_id
        AND apiaries.owner_id = (SELECT auth.uid())
    )
  );

-- ── Refresh function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_gdd_view()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY apiary_gdd_cumulative;
$$;
