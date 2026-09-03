-- Демо-заказчики: витрина. Помечены is_demo = TRUE.
INSERT INTO t_p87694549_free_task_finder.users
  (max_id, role, name, city, contact, about, rating, reviews_count, done_count,
   accepted_terms, token, avatar, gender, verified, is_demo, last_seen, created_at)
VALUES
('demo_cu_01','customer','Ольга','Ярославль, Кировский район','Отклик в чате','',4.90,12,14,TRUE,'demo_tok_cu01','/demo/avatars/f1.jpg','female',TRUE,TRUE,NOW()-INTERVAL '3 hours',NOW()-INTERVAL '87 days'),
('demo_cu_02','customer','Дмитрий','Ярославль, Ленинский район','Отклик в чате','',4.80,8,9,TRUE,'demo_tok_cu02','/demo/avatars/m1.jpg','male',TRUE,TRUE,NOW()-INTERVAL '6 hours',NOW()-INTERVAL '64 days'),
('demo_cu_03','customer','Наталья','Ярославль, Заволжский район','Отклик в чате','',5.00,15,17,TRUE,'demo_tok_cu03','/demo/avatars/f2.jpg','female',TRUE,TRUE,NOW()-INTERVAL '1 hour',NOW()-INTERVAL '109 days'),
('demo_cu_04','customer','Сергей','Ярославль, Дзержинский район','Отклик в чате','',4.70,6,7,TRUE,'demo_tok_cu04','/demo/avatars/m3.jpg','male',TRUE,TRUE,NOW()-INTERVAL '9 hours',NOW()-INTERVAL '52 days'),
('demo_cu_05','customer','Елена','Ярославль, Центр','Отклик в чате','',4.90,11,13,TRUE,'demo_tok_cu05','/demo/avatars/f3.jpg','female',TRUE,TRUE,NOW()-INTERVAL '4 hours',NOW()-INTERVAL '78 days'),
('demo_cu_06','customer','Андрей','Ярославль, Фрунзенский район','Отклик в чате','',4.60,5,6,TRUE,'demo_tok_cu06','/demo/avatars/m6.jpg','male',TRUE,TRUE,NOW()-INTERVAL '1 day',NOW()-INTERVAL '43 days'),
('demo_cu_07','customer','Татьяна','Рыбинск','Отклик в чате','',4.80,9,10,TRUE,'demo_tok_cu07','/demo/avatars/f4.jpg','female',TRUE,TRUE,NOW()-INTERVAL '7 hours',NOW()-INTERVAL '69 days'),
('demo_cu_08','customer','Ирина','Ярославль, Красноперекопский район','Отклик в чате','',4.70,7,8,TRUE,'demo_tok_cu08','/demo/avatars/f5.jpg','female',TRUE,TRUE,NOW()-INTERVAL '11 hours',NOW()-INTERVAL '57 days'),
('demo_cu_09','customer','Михаил','Тутаев','Отклик в чате','',4.50,4,5,TRUE,'demo_tok_cu09','/demo/avatars/m7.jpg','male',TRUE,TRUE,NOW()-INTERVAL '2 days',NOW()-INTERVAL '38 days'),
('demo_cu_10','customer','Владимир','Переславль-Залесский','Отклик в чате','',4.60,6,7,TRUE,'demo_tok_cu10','/demo/avatars/m5.jpg','male',TRUE,TRUE,NOW()-INTERVAL '1 day',NOW()-INTERVAL '46 days');