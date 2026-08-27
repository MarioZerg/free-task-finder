UPDATE support_tickets SET status = 'closed' WHERE id = 2;
UPDATE users SET subscription_until = NULL WHERE max_id IN ('demo_customer', 'demo_executor');
