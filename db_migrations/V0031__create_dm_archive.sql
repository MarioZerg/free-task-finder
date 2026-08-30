CREATE TABLE IF NOT EXISTS dm_archive (
    user_id INTEGER NOT NULL REFERENCES users(id),
    peer_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, peer_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_archive_user ON dm_archive(user_id);
