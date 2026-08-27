UPDATE login_codes
SET status = 'confirmed',
    max_id = 'demo_exec_ui',
    max_user_id = '900001',
    max_name = 'Демо Исполнитель',
    confirmed_at = NOW()
WHERE code = '660248' AND status = 'pending';
