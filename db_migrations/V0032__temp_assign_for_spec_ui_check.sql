UPDATE jobs
SET status = 'assigned',
    assigned_executor_id = 11,
    assigned_at = NOW(),
    deadline_at = NOW() + INTERVAL '48 hours'
WHERE id = 16;
