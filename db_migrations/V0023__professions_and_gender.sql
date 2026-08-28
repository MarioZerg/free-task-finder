CREATE TABLE IF NOT EXISTS professions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,
    label VARCHAR(80) NOT NULL,
    icon VARCHAR(40) DEFAULT 'Wrench',
    sort_order INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS user_professions (
    user_id INTEGER NOT NULL REFERENCES users(id),
    profession_id INTEGER NOT NULL REFERENCES professions(id),
    PRIMARY KEY (user_id, profession_id)
);

CREATE INDEX IF NOT EXISTS idx_user_professions_prof ON user_professions(profession_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT '';

INSERT INTO professions (slug, label, icon, sort_order) VALUES
    ('handyman', 'Муж на час', 'Wrench', 10),
    ('electrician', 'Электрик', 'Zap', 20),
    ('plumber', 'Сантехник', 'Droplets', 30),
    ('mover', 'Грузчик', 'Package', 40),
    ('driver', 'Водитель с авто', 'Truck', 50),
    ('cleaner', 'Уборка', 'Sparkles', 60),
    ('finisher', 'Отделочник', 'PaintRoller', 70),
    ('carpenter', 'Плотник, столяр', 'Hammer', 80),
    ('furniture', 'Сборка мебели', 'Armchair', 90),
    ('welder', 'Сварщик', 'Flame', 100),
    ('gardener', 'Садовые работы', 'Trees', 110),
    ('digger', 'Земляные работы', 'Shovel', 120),
    ('roofer', 'Кровельщик', 'Home', 130),
    ('tiler', 'Плиточник', 'Grid3x3', 140),
    ('painter', 'Маляр', 'Brush', 150),
    ('appliance', 'Ремонт техники', 'Cpu', 160),
    ('courier', 'Курьер', 'Bike', 170),
    ('snow', 'Уборка снега', 'Snowflake', 180),
    ('demolition', 'Демонтаж', 'Pickaxe', 190),
    ('other', 'Разнорабочий', 'HardHat', 200)
ON CONFLICT (slug) DO NOTHING;
