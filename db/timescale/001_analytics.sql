CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS click_events (
  time TIMESTAMPTZ NOT NULL DEFAULT now(),
  link_id UUID NOT NULL,
  code TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT
);

SELECT create_hypertable('click_events', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_click_events_code_time
  ON click_events (code, time DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS click_rollups_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  code,
  count(*) AS clicks,
  count(DISTINCT ip_hash) AS unique_visitors
FROM click_events
GROUP BY bucket, code
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS click_rollups_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  code,
  count(*) AS clicks,
  count(DISTINCT ip_hash) AS unique_visitors
FROM click_events
GROUP BY bucket, code
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
  'click_rollups_hourly',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy(
  'click_rollups_daily',
  start_offset => INTERVAL '90 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);
