UPDATE login_codes
SET status = 'confirmed',
    max_id = 'preview_cust',
    max_user_id = '900002',
    max_name = 'Проверка Заказчик',
    confirmed_at = NOW()
WHERE code = '557024' AND status = 'pending';
