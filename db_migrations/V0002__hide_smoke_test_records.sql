UPDATE jobs SET status = 'cancelled' WHERE id = 1;
UPDATE users SET role = 'archived' WHERE max_id IN ('test_zakaz', 'test_ispol');
