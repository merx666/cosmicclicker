-- Season 3 Reset + Void Bastion Tables Migration
-- Run this on the target PostgreSQL database

-- 1. ALTER USERS TABLE TO SUPPORT VOID BASTION
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_games_played INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_wave INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_earned BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_enemies_killed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent_wld DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS playtime_seconds INTEGER DEFAULT 0;

-- Create index on highest_wave and total_spent for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_highest_wave ON users(highest_wave DESC);
CREATE INDEX IF NOT EXISTS idx_total_spent ON users(total_spent_wld DESC);

-- 2. CREATE VOID BASTION TABLES WITH UUID MAPPING
CREATE TABLE IF NOT EXISTS user_energy (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_energy INTEGER DEFAULT 5,
    max_energy INTEGER DEFAULT 5,
    last_refill TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_refill_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0,
    last_claim_date DATE,
    total_days_claimed INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_current_streak ON user_streaks(current_streak DESC);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    price_wld DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(66),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_purchases ON purchases(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_type ON purchases(item_type);

CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_items ON user_inventory(user_id, item_type);

CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wave_reached INTEGER NOT NULL,
    credits_earned INTEGER DEFAULT 0,
    enemies_killed INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    difficulty_level VARCHAR(20) DEFAULT 'normal',
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions ON game_sessions(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_wave_reached ON game_sessions(wave_reached DESC, played_at DESC);

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    achievement_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type VARCHAR(20),
    reward_value VARCHAR(50),
    icon_url VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements ON user_achievements(user_id, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_earned_wld DECIMAL(10,4) DEFAULT 0,
    UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrer ON referrals(referrer_id);

CREATE TABLE IF NOT EXISTS guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    leader_id UUID REFERENCES users(id),
    total_waves INTEGER DEFAULT 0,
    guild_perks JSON
);

CREATE TABLE IF NOT EXISTS battle_pass (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    season INTEGER,
    tier INTEGER DEFAULT 1,
    is_premium BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, season)
);

-- Insert achievements if they do not exist
INSERT INTO achievements (achievement_id, name, description, reward_type, reward_value) VALUES
('first_blood', 'First Blood', 'Kill your first enemy', 'credits', '50'),
('wave_10', 'Survivor', 'Reach wave 10', 'credits', '100'),
('wave_50', 'Defender', 'Reach wave 50', 'credits', '500'),
('wave_100', 'Centurion', 'Reach wave 100', 'item', 'premium_turret'),
('streak_7', 'Week Warrior', '7-day login streak', 'credits', '200'),
('streak_21', 'Dedicated', '21-day login streak', 'skin', 'legendary_bastion'),
('first_purchase', 'Supporter', 'Make your first purchase', 'credits', '100'),
('whale', 'Whale', 'Spend 1 WLD total', 'skin', 'vip_badge'),
('kills_1000', 'Exterminator', 'Kill 1000 enemies', 'credits', '300'),
('kills_10000', 'Annihilator', 'Kill 10000 enemies', 'item', 'laser_turret')
ON CONFLICT (achievement_id) DO NOTHING;

-- 3. SEASON 3 STATISTICS RESET (LEAVE ONLY VIP PACKAGES STATUS)
-- Reset particle stats and upgrade levels
UPDATE users 
SET 
    particles = 0,
    total_particles_collected = 0,
    total_passive_particles = 0,
    total_clicks = 0,
    particles_per_click = 1,
    particles_per_second = 0,
    upgrade_click_power = 1,
    upgrade_auto_collector = 0,
    upgrade_multiplier = 0,
    upgrade_offline = 0,
    daily_clicks = 0,
    daily_passive_particles = 0,
    daily_particles_collected = 0,
    last_daily_reset = NULL,
    claimed_missions = '[]'::jsonb,
    -- Keep premium_vip, reset all other premium flags if not VIP
    premium_particle_skin = CASE WHEN premium_vip = TRUE THEN premium_particle_skin ELSE 'default' END,
    premium_background_theme = CASE WHEN premium_vip = TRUE THEN premium_background_theme ELSE 'default' END,
    premium_auto_save = CASE WHEN premium_vip = TRUE THEN premium_auto_save ELSE FALSE END,
    premium_statistics = CASE WHEN premium_vip = TRUE THEN premium_statistics ELSE FALSE END,
    premium_notifications = CASE WHEN premium_vip = TRUE THEN premium_notifications ELSE FALSE END,
    premium_lucky_particle = CASE WHEN premium_vip = TRUE THEN premium_lucky_particle ELSE FALSE END,
    premium_offline_earnings = CASE WHEN premium_vip = TRUE THEN premium_offline_earnings ELSE FALSE END,
    premium_daily_bonus = CASE WHEN premium_vip = TRUE THEN premium_daily_bonus ELSE FALSE END,
    unlocked_skins = CASE WHEN premium_vip = TRUE THEN unlocked_skins ELSE '["default"]'::jsonb END,
    unlocked_themes = CASE WHEN premium_vip = TRUE THEN unlocked_themes ELSE '["default"]'::jsonb END;

-- Reset missions so they can be re-completed
TRUNCATE TABLE missions CASCADE;
