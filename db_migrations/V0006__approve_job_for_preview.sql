UPDATE jobs SET moderation = 'approved', expires_at = NOW() + INTERVAL '24 hours' WHERE id = 3;
