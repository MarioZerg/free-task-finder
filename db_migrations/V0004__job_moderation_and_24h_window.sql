ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderation VARCHAR(20) NOT NULL DEFAULT 'approved';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

UPDATE jobs SET expires_at = created_at + INTERVAL '24 hours' WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_moderation_idx ON jobs(moderation, status);
