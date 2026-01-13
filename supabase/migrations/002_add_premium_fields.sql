-- Add premium columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_particle_skin TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_background_theme TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_auto_save BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_statistics BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_lucky_particle BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_offline_earnings BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_daily_bonus BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_bonus_time TIMESTAMP;

-- Add unlocked items arrays (CRITICAL: without these, purchased skins/themes won't save!)
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_skins JSONB DEFAULT '["default"]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_themes JSONB DEFAULT '["default"]'::jsonb;
