-- VIP Tier System
-- Adds tiered VIP levels: Bronze (1), Silver (2), Gold (3), Platinum (4)
-- Existing VIP users are migrated to Bronze tier

-- Add vip_tier column
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier INTEGER DEFAULT 0;

-- Migrate existing VIP users to Bronze (tier 1)
UPDATE users SET vip_tier = 1 WHERE premium_vip = true AND vip_tier = 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON users(vip_tier);

-- Comment for documentation
COMMENT ON COLUMN users.vip_tier IS 'VIP tier level: 0=none, 1=bronze, 2=silver, 3=gold, 4=platinum';
