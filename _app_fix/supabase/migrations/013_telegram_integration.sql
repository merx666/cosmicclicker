-- Migration 013: Telegram Integration
-- Allow world_id_nullifier to be NULL since Telegram users might not have authenticated via World ID initially
ALTER TABLE users ALTER COLUMN world_id_nullifier DROP NOT NULL;

-- Add Telegram identity columns
ALTER TABLE users ADD COLUMN telegram_id bigint UNIQUE;
ALTER TABLE users ADD COLUMN telegram_username text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
