-- Профессия заказа: нужна, чтобы уведомления приходили исполнителям
-- только по их специальностям, а не всем подряд в городе.
ALTER TABLE t_p87694549_free_task_finder.jobs
  ADD COLUMN IF NOT EXISTS profession_slug VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_jobs_profession
  ON t_p87694549_free_task_finder.jobs (profession_slug);