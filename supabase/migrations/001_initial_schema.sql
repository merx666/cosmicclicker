-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id_nullifier TEXT UNIQUE NOT NULL,
  username TEXT,
  particles BIGINT DEFAULT 0,
  total_particles_collected BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  particles_per_click INT DEFAULT 1,
  particles_per_second INT DEFAULT 0,
  
  -- Upgrade levels
  upgrade_click_power INT DEFAULT 1,
  upgrade_auto_collector INT DEFAULT 0,
  upgrade_multiplier INT DEFAULT 0,
  upgrade_offline INT DEFAULT 0,
  
  -- Rewards & claims
  total_wld_claimed DECIMAL(18, 8) DEFAULT 0,
  last_claim_time TIMESTAMP,
  
  -- Engagement tracking
  login_streak INT DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Missions table
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  reward_particles INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_nullifier ON users(world_id_nullifier);
CREATE INDEX idx_users_particles ON users(total_particles_collected DESC);
CREATE INDEX idx_missions_user ON missions(user_id, mission_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
