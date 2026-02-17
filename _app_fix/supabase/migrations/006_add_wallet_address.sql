-- Migration: Add wallet_address column for payouts
-- Run this in Supabase SQL Editor

-- Add wallet_address column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Update existing users: copy world_id_nullifier to wallet_address
-- (since world_id_nullifier already contains the wallet address)
UPDATE users 
SET wallet_address = world_id_nullifier 
WHERE wallet_address IS NULL AND world_id_nullifier IS NOT NULL;

-- Verify
SELECT id, world_id_nullifier, wallet_address FROM users LIMIT 5;
