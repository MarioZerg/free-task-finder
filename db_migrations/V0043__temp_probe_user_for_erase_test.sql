-- Временный пользователь для проверки удаления. Будет стёрт сразу после теста.
INSERT INTO users (max_id, role, name, city, phone, contact, skill, about, token, accepted_terms)
VALUES ('test_erase_probe', 'executor', 'Проверка Удаления',
        'Ярославль', '+79001112233', 'тестовый контакт', 'Тестировщик',
        'Временный профиль для проверки удаления.', 'test_erase_token_probe', TRUE)
ON CONFLICT (max_id, role) DO NOTHING;

-- Задание от его имени: проверим, что оно переживёт удаление автора
INSERT INTO jobs (owner_id, title, description, city, price, when_text, category, status)
SELECT id, 'Тестовое задание для проверки удаления',
       'Проверка того, что задание переживает удаление автора.',
       'Ярославль', 1000, 'сегодня', 'Разное', 'open'
FROM users WHERE max_id = 'test_erase_probe'
  AND NOT EXISTS (SELECT 1 FROM jobs WHERE title = 'Тестовое задание для проверки удаления');
