-- NULL means historical acquisition was not recorded; do not invent attribution.
ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS acquisition jsonb;
