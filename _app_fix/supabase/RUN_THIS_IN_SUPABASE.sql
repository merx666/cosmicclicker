-- ============================================
-- VOID COLLECTOR - PREMIUM FIELDS MIGRATION
-- ============================================
-- Run this SQL in Supabase Dashboard to fix premium item saving
-- This is safe to run multiple times (uses IF NOT EXISTS)

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

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND (column_name LIKE '%premium%' OR column_name LIKE '%unlocked%')
ORDER BY ordinal_position;
