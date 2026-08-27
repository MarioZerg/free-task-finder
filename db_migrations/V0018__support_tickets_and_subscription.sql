CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic VARCHAR(60) NOT NULL DEFAULT 'other',
    text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    answer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    answered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS support_status_idx ON support_tickets(status, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMP;
