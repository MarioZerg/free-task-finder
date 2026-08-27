UPDATE login_codes
SET status = 'confirmed', max_id = 'max212227255', max_user_id = '212227255',
    max_name = 'Андрей', confirmed_at = NOW()
WHERE code = '946700' AND status = 'pending';
