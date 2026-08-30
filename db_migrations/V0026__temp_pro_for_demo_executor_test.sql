UPDATE users SET subscription_until = NOW() + INTERVAL '10 minutes' WHERE id = 11;
