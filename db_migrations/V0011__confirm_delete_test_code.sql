UPDATE login_codes
SET status = 'confirmed', max_id = 'del_test', max_user_id = '900003',
    max_name = 'Тест Удаления', confirmed_at = NOW()
WHERE code = '501441' AND status = 'pending';
