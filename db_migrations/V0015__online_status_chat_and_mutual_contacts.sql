ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
UPDATE users SET last_seen = created_at WHERE last_seen IS NULL;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_contact_shared BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE jobs SET owner_contact_shared = TRUE WHERE status IN ('assigned', 'expiring', 'done');

CREATE TABLE IF NOT EXISTS job_messages (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_messages_job_idx ON job_messages(job_id, created_at);
