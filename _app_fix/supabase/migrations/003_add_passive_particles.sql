-- Add total_passive_particles field to users table
-- This tracks particles earned through auto-collector for daily missions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_passive_particles BIGINT DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_passive_particles ON users(total_passive_particles DESC);

-- Update comment
COMMENT ON COLUMN users.total_passive_particles IS 'Total particles collected passively through auto-collector (for daily missions tracking)';
