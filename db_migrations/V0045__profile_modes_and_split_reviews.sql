-- Режимы профиля и раздельные описания.
--
-- После объединения ролей профиль один, но людям нужно показывать,
-- чем именно они готовы заниматься: брать заказы, размещать задачи
-- или и то и другое. Это два независимых переключателя, а не роль:
-- можно включить оба, можно оставить один.

-- Готов брать заказы. По умолчанию включено: почти все, кто уже
-- зарегистрирован, приходили именно как исполнители.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS as_executor BOOLEAN NOT NULL DEFAULT TRUE;

-- Размещаю задачи. Тоже включено по умолчанию — с общего профиля
-- заказать может каждый, и скрывать эту возможность незачем.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS as_customer BOOLEAN NOT NULL DEFAULT TRUE;

-- Отдельные описания под каждую сторону. Старое поле about остаётся
-- как описание исполнителя (оно так и заполнялось), а для заказчика
-- заводим своё: какие задачи обычно поручает, чего ждёт от мастера.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS about_customer TEXT NOT NULL DEFAULT '';

-- Сколько задач человек разместил. Считать это на лету по jobs можно,
-- но счётчик нужен в списке людей — там иначе получился бы подзапрос
-- на каждую из 200 строк.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_count INTEGER NOT NULL DEFAULT 0;

-- Разделяем рейтинг и число отзывов по стороне сделки: отзыв о работе
-- исполнителя и отзыв о человеке как о заказчике — разные вещи,
-- и смешивать их в одну звёздочку неправильно.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS rating_executor NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reviews_executor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS rating_customer NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reviews_customer INTEGER NOT NULL DEFAULT 0;

-- В самом отзыве фиксируем, за какую сторону он выставлен. Определить
-- это можно и через jobs, но тогда правка заказа задним числом меняла бы
-- смысл старых отзывов.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS target_side VARCHAR(20) NOT NULL DEFAULT 'executor';

-- Проставляем сторону уже существующим отзывам: если отзыв адресован
-- владельцу задачи — это отзыв заказчику, иначе исполнителю.
UPDATE reviews r
SET target_side = CASE
      WHEN j.owner_id = r.target_id THEN 'customer'
      ELSE 'executor'
    END
FROM jobs j
WHERE j.id = r.job_id;

-- Заполняем новые счётчики по фактическим данным.
UPDATE users u
SET created_count = COALESCE((
      SELECT COUNT(*) FROM jobs j WHERE j.owner_id = u.id
    ), 0);

UPDATE users u
SET rating_executor = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r
      WHERE r.target_id = u.id AND r.hidden = FALSE AND r.target_side = 'executor'
    ), 0),
    reviews_executor = COALESCE((
      SELECT COUNT(*) FROM reviews r
      WHERE r.target_id = u.id AND r.hidden = FALSE AND r.target_side = 'executor'
    ), 0),
    rating_customer = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r
      WHERE r.target_id = u.id AND r.hidden = FALSE AND r.target_side = 'customer'
    ), 0),
    reviews_customer = COALESCE((
      SELECT COUNT(*) FROM reviews r
      WHERE r.target_id = u.id AND r.hidden = FALSE AND r.target_side = 'customer'
    ), 0);

-- Фильтр во вкладке «Люди» ходит по этим двум флагам.
CREATE INDEX IF NOT EXISTS users_modes_idx
  ON users (as_executor, as_customer)
  WHERE erased_at IS NULL AND role = 'member';