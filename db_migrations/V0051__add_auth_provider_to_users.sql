-- Через какой мессенджер человек вошёл в сервис.
-- Сейчас вход только через MAX, но задел на будущее: когда появятся
-- другие способы, значок в карточке покажет, откуда пришёл человек,
-- а сравнение по этому полю ответит, какой канал приводит людей.
ALTER TABLE t_p87694549_free_task_finder.users
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'max';

-- Все, кто зарегистрирован до этого момента, пришли через MAX —
-- другого способа входа в сервисе не было.
UPDATE t_p87694549_free_task_finder.users
   SET auth_provider = 'max'
 WHERE auth_provider IS NULL OR auth_provider = '';

CREATE INDEX IF NOT EXISTS idx_users_auth_provider
    ON t_p87694549_free_task_finder.users (auth_provider);