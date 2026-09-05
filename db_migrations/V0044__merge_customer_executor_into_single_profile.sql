-- Объединение ролей: заказчик и исполнитель становятся одним профилем.
--
-- Раньше один человек заводил ДВА аккаунта под одним max_id — по одному на
-- роль. Регистрировались почти только исполнители, а заказчики остались
-- демонстрационными. Теперь роль не различает людей: с одного профиля можно
-- и размещать задачи, и брать заказы.

-- 1. Слияние двух аккаунтов max212227255 (выбор пользователя — «объединить всё»).
--    Основой берём профиль исполнителя (id 6): там опыт, район и текст о себе.
--    Телефон второго аккаунта дописываем в контакты, чтобы связь не потерялась.
UPDATE users
SET contact = '+79992342411, +79997863525'
WHERE id = 6;

-- Всё, что было привязано к аккаунту-заказчику, переносим на оставшийся
-- профиль. Сейчас таких записей нет, но перенос защищает от потери данных,
-- если что-то появится до выката кода.
UPDATE jobs             SET owner_id             = 6 WHERE owner_id             = 5;
UPDATE jobs             SET assigned_executor_id = 6 WHERE assigned_executor_id = 5;
UPDATE job_responses    SET executor_id          = 6 WHERE executor_id          = 5;
UPDATE direct_messages  SET from_id              = 6 WHERE from_id              = 5;
UPDATE direct_messages  SET to_id                = 6 WHERE to_id                = 5;
UPDATE payments         SET user_id              = 6 WHERE user_id              = 5;

-- Лишний аккаунт помечаем стёртым: сервис такие профили нигде не показывает.
-- max_id обнуляем, иначе он занимал бы место в новом ограничении уникальности.
UPDATE users
SET erased_at = NOW(),
    role      = 'archived',
    blocked   = TRUE,
    max_id    = 'merged-5-into-6',
    name      = 'Объединён с профилем 6'
WHERE id = 5;

-- 2. Демо-заказчики и их заказы убираются из сервиса (выбор пользователя).
--    Лента станет пустой — старт на реальных заказах.
--    Заказы закрываем и снимаем с публикации: в ленту попадают только
--    approved + open, поэтому такие записи нигде не появятся.
UPDATE jobs
SET status     = 'cancelled',
    moderation = 'rejected'
WHERE owner_id IN (SELECT id FROM users WHERE role = 'customer' AND is_demo);

UPDATE users
SET erased_at = NOW(),
    role      = 'archived',
    blocked   = TRUE,
    max_id    = 'erased-demo-customer-' || id
WHERE role = 'customer' AND is_demo;

-- 3. Живым аккаунтам ставим единую роль. Значение 'archived' сохраняем —
--    на нём держится скрытие демо-профилей из V0039.
UPDATE users SET role = 'member' WHERE role IN ('customer', 'executor');

-- 4. Один max_id — один профиль. Прежнее ограничение UNIQUE (max_id, role)
--    существовало ровно ради двух аккаунтов на человека и больше не нужно.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_max_id_role_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_max_id_uniq
  ON users (max_id)
  WHERE erased_at IS NULL AND role <> 'archived';

-- Новые аккаунты создаются сразу как member — роль в них больше не передаётся.
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';