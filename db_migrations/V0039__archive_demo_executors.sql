-- Демо-исполнители убираются из сервиса: роль archived исключает профиль
-- из списка людей, каталога, счётчиков и рассылок.
-- Демо-заказчики и демо-заказы остаются как витрина ленты.
UPDATE t_p87694549_free_task_finder.users
SET role = 'archived',
    blocked = TRUE,
    verified = FALSE,
    last_seen = NULL
WHERE is_demo = TRUE AND role = 'executor';

UPDATE t_p87694549_free_task_finder.jobs
SET assigned_executor_id = NULL, assigned_at = NULL
WHERE assigned_executor_id IN (
  SELECT id FROM t_p87694549_free_task_finder.users
  WHERE is_demo = TRUE AND role = 'archived'
);