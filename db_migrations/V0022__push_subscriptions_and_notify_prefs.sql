CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent VARCHAR(300) DEFAULT '',
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_responses BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_status BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS push_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    kind VARCHAR(30) NOT NULL,
    title VARCHAR(200) DEFAULT '',
    body VARCHAR(400) DEFAULT '',
    url VARCHAR(300) DEFAULT '',
    job_id INTEGER,
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_log(user_id, created_at DESC);
