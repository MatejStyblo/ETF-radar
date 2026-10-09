CREATE TABLE IF NOT EXISTS leads (
 id uuid PRIMARY KEY, email text NOT NULL, email_key text NOT NULL UNIQUE,
 marketing_consent boolean NOT NULL, privacy_notice_version text NOT NULL,
 privacy_notice_at timestamptz NOT NULL DEFAULT now(), marketing_consent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reports (
 id uuid PRIMARY KEY, token_hash text NOT NULL UNIQUE, snapshot jsonb NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS submission_receipts (
 attempt_id uuid PRIMARY KEY, payload_hash text NOT NULL, lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
 is_new_lead boolean NOT NULL, attribution jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
 bucket_key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
