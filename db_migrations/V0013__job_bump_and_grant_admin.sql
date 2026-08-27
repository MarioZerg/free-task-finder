ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMP;
UPDATE jobs SET bumped_at = created_at WHERE bumped_at IS NULL;

UPDATE users SET is_admin = TRUE WHERE max_id = 'max212227255';
