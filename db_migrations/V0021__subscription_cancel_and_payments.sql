ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_auto_renew BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    months INTEGER NOT NULL DEFAULT 1,
    provider VARCHAR(30) NOT NULL DEFAULT 'tochka',
    operation_id VARCHAR(120),
    payment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_operation_idx ON payments(operation_id);
