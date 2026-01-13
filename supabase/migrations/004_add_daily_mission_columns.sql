-- Migration: Add missing daily mission columns
-- These columns are required for saveGameState to work properly

ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_clicks BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_passive_particles BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_particles_collected BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS claimed_missions JSONB DEFAULT '[]'::jsonb;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('daily_clicks', 'daily_passive_particles', 'daily_particles_collected', 'last_daily_reset', 'claimed_missions');
