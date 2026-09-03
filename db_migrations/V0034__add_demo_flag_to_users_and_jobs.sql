ALTER TABLE t_p87694549_free_task_finder.users
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE t_p87694549_free_task_finder.jobs
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_demo
  ON t_p87694549_free_task_finder.users (is_demo);

CREATE INDEX IF NOT EXISTS idx_jobs_is_demo
  ON t_p87694549_free_task_finder.jobs (is_demo);