ALTER TABLE submission_receipts ALTER COLUMN report_id DROP NOT NULL;
ALTER TABLE submission_receipts DROP CONSTRAINT IF EXISTS submission_receipts_report_id_fkey;
ALTER TABLE submission_receipts ADD CONSTRAINT submission_receipts_report_id_fkey FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE SET NULL;
