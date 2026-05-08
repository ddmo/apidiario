-- Drop unused weather tables created in phenology migration.
-- Weather data fetched directly from Open-Meteo in the browser.

DROP MATERIALIZED VIEW IF EXISTS apiary_gdd_cumulative CASCADE;
DROP TABLE IF EXISTS daily_weather CASCADE;
DROP FUNCTION IF EXISTS refresh_gdd_view();
