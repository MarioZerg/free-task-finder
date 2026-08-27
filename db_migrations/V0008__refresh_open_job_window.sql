UPDATE jobs SET expires_at = NOW() + INTERVAL '24 hours' WHERE id = 3 AND status = 'open';
