CREATE TABLE IF NOT EXISTS analytics_sessions (
 id uuid PRIMARY KEY, ad_variant text NOT NULL CHECK(ad_variant IN ('a','b')),
 expires_at timestamptz NOT NULL, revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analytics_events (
 event_id uuid NOT NULL, source text NOT NULL CHECK(source IN ('client','server')), session_id uuid NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
 name text NOT NULL, ad_variant text NOT NULL CHECK(ad_variant IN ('a','b')), is_new_lead boolean, schema_version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(event_id,source)
);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_once ON analytics_events(session_id,name) WHERE name IN ('landing_view','comparison_started','results_viewed','lead_offer_viewed','lead_form_started');
ALTER TABLE submission_receipts ADD COLUMN IF NOT EXISTS analytics_session_id uuid;
