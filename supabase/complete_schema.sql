-- Void Collector - Complete Schema
-- Combined migration for local PostgreSQL

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id_nullifier TEXT UNIQUE NOT NULL,
  username TEXT,
  particles BIGINT DEFAULT 0,
  total_particles_collected BIGINT DEFAULT 0,
  total_passive_particles BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  particles_per_click INT DEFAULT 1,
  particles_per_second INT DEFAULT 0,
  
  -- Upgrade levels
  upgrade_click_power INT DEFAULT 1,
  upgrade_auto_collector INT DEFAULT 0,
  upgrade_multiplier INT DEFAULT 0,
  upgrade_offline INT DEFAULT 0,
  
  -- Premium features
  premium_particle_skin TEXT DEFAULT 'default',
  premium_background_theme TEXT DEFAULT 'default',
  premium_auto_save BOOLEAN DEFAULT FALSE,
  premium_statistics BOOLEAN DEFAULT FALSE,
  premium_notifications BOOLEAN DEFAULT FALSE,
  premium_lucky_particle BOOLEAN DEFAULT FALSE,
  premium_offline_earnings BOOLEAN DEFAULT FALSE,
  premium_daily_bonus BOOLEAN DEFAULT FALSE,
  premium_vip BOOLEAN DEFAULT FALSE,
  last_daily_bonus_time TIMESTAMP,
  unlocked_skins JSONB DEFAULT '["default"]'::jsonb,
  unlocked_themes JSONB DEFAULT '["default"]'::jsonb,
  
  -- Daily mission counters
  daily_clicks BIGINT DEFAULT 0,
  daily_passive_particles BIGINT DEFAULT 0,
  daily_particles_collected BIGINT DEFAULT 0,
  last_daily_reset TIMESTAMP,
  claimed_missions JSONB DEFAULT '[]'::jsonb,
  
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

-- Daily conversions tracking (for global WLD cap)
CREATE TABLE daily_conversions (
  id BIGSERIAL PRIMARY KEY,
  conversion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_wld_claimed DECIMAL(10, 4) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversion_date)
);

-- Indexes for performance
CREATE INDEX idx_users_nullifier ON users(world_id_nullifier);
CREATE INDEX idx_users_particles ON users(total_particles_collected DESC);
CREATE INDEX idx_users_passive_particles ON users(total_passive_particles DESC);
CREATE INDEX idx_missions_user ON missions(user_id, mission_type);
CREATE INDEX idx_conversion_date ON daily_conversions(conversion_date DESC);

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

-- Function: Atomic increment of daily WLD (concurrent-safe)
CREATE OR REPLACE FUNCTION increment_daily_wld(
  p_amount DECIMAL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_conversions (conversion_date, total_wld_claimed, conversion_count)
  VALUES (p_date, p_amount, 1)
  ON CONFLICT (conversion_date) 
  DO UPDATE SET
    total_wld_claimed = daily_conversions.total_wld_claimed + p_amount,
    conversion_count = daily_conversions.conversion_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to void_user
GRANT ALL ON ALL TABLES IN SCHEMA public TO void_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO void_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO void_user;

-- Insert today's record to initialize
INSERT INTO daily_conversions (conversion_date, total_wld_claimed, conversion_count)
VALUES (CURRENT_DATE, 0, 0)
ON CONFLICT (conversion_date) DO NOTHING;
