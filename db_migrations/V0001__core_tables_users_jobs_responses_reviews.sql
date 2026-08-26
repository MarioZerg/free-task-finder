CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    max_id VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL,
    name VARCHAR(160) NOT NULL,
    city VARCHAR(160) NOT NULL DEFAULT 'Ярославль',
    phone VARCHAR(60),
    contact VARCHAR(200),
    skill VARCHAR(200),
    about TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    done_count INTEGER NOT NULL DEFAULT 0,
    accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
    token VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (max_id, role)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_token_idx ON users(token);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    city VARCHAR(160) NOT NULL,
    when_text VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    photo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    assigned_executor_id INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP,
    deadline_at TIMESTAMP,
    executor_contact_shared BOOLEAN NOT NULL DEFAULT FALSE,
    final_price INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_owner_idx ON jobs(owner_id);

CREATE TABLE IF NOT EXISTS job_responses (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    executor_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, executor_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    target_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, author_id)
);

CREATE INDEX IF NOT EXISTS reviews_target_idx ON reviews(target_id);
