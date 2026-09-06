-- Три способа назначить цену: точная сумма, вилка «от и до», договорная.
-- Старые заказы остаются фиксированными — price у них уже заполнен.
-- У договорных price = 0, у вилки price — нижняя граница, price_max — верхняя.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_max INTEGER;

ALTER TABLE jobs ADD CONSTRAINT jobs_price_type_chk
  CHECK (price_type IN ('fixed', 'range', 'negotiable'));
