CREATE TABLE IF NOT EXISTS job_invites (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    executor_id INTEGER NOT NULL REFERENCES users(id),
    customer_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, executor_id)
);

CREATE INDEX IF NOT EXISTS job_invites_executor_idx ON job_invites(executor_id, status);

CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    from_id INTEGER NOT NULL REFERENCES users(id),
    to_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS direct_messages_pair_idx ON direct_messages(from_id, to_id, created_at);
CREATE INDEX IF NOT EXISTS direct_messages_pair_idx2 ON direct_messages(to_id, from_id, created_at);
