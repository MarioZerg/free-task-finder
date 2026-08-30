UPDATE jobs
SET status = 'open',
    assigned_executor_id = NULL,
    assigned_at = NULL,
    deadline_at = NULL
WHERE id = 16;
