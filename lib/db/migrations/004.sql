-- Historical events remain unknown (NULL); do not infer or backfill pairs.
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS etf_ids text[];
