-- Migration: Daily Conversion Tracking (Global WLD Cap)
-- Purpose: Track daily WLD conversions globally to enforce 100 WLD/day limit

-- Create daily_conversions table
CREATE TABLE IF NOT EXISTS daily_conversions (
  id BIGSERIAL PRIMARY KEY,
  conversion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_wld_claimed DECIMAL(10, 4) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversion_date)
);

-- Index for fast today lookup
CREATE INDEX idx_conversion_date ON daily_conversions(conversion_date DESC);

-- Enable Row Level Security
ALTER TABLE daily_conversions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (to check daily stats)
CREATE POLICY "Allow public read daily conversions" 
  ON daily_conversions 
  FOR SELECT 
  USING (true);

-- Policy: Only service role can write (API endpoints only)
CREATE POLICY "Service role can insert/update daily conversions"
  ON daily_conversions
  FOR ALL
  USING (auth.role() = 'service_role');

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert today's record with 0 to initialize
INSERT INTO daily_conversions (conversion_date, total_wld_claimed, conversion_count)
VALUES (CURRENT_DATE, 0, 0)
ON CONFLICT (conversion_date) DO NOTHING;

-- Comment
COMMENT ON TABLE daily_conversions IS 'Tracks daily WLD conversions globally to enforce 100 WLD/day cap';
COMMENT ON FUNCTION increment_daily_wld IS 'Atomically increments daily WLD total (concurrent-safe)';
