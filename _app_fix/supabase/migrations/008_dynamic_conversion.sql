-- Dynamic conversion rate system
-- Config table for app-wide settings
CREATE TABLE IF NOT EXISTS app_config (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default conversion rate
INSERT INTO app_config (key, value) VALUES 
('conversion_rate', '{"particles_per_wld": 150000, "wld_price_usd": 0.465, "last_update": "2026-01-30T17:00:00Z"}')
ON CONFLICT (key) DO NOTHING;

-- Track user withdrawals for analytics and limits
CREATE TABLE IF NOT EXISTS withdrawal_history (
    id SERIAL PRIMARY KEY,
    world_id_nullifier VARCHAR(255) NOT NULL,
    particles_spent INTEGER NOT NULL,
    wld_amount DECIMAL(10, 4) NOT NULL,
    conversion_rate INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_history(world_id_nullifier);
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawal_history(created_at DESC);

-- Add daily limits tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_withdrawal_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_withdrawal_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_withdrawal_amount DECIMAL(10, 4) DEFAULT 0;

-- Comments
COMMENT ON TABLE app_config IS 'Application-wide configuration settings';
COMMENT ON TABLE withdrawal_history IS 'Tracks all WLD withdrawal transactions';
