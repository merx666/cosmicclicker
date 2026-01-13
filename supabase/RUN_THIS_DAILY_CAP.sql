-- ============================================
-- Daily WLD Cap Migration
-- RUN THIS IN SUPABASE DASHBOARD
-- ============================================

-- Copy entire content below into Supabase SQL Editor and run:

-- 1. Create daily_conversions table
CREATE TABLE IF NOT EXISTS daily_conversions (
  id BIGSERIAL PRIMARY KEY,
  conversion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_wld_claimed DECIMAL(10, 4) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversion_date)
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_conversion_date ON daily_conversions(conversion_date DESC);

-- 3. Enable RLS
ALTER TABLE daily_conversions ENABLE ROW LEVEL SECURITY;

-- 4. Add policy for public read
DROP POLICY IF EXISTS "Allow public read daily conversions" ON daily_conversions;
CREATE POLICY "Allow public read daily conversions" 
  ON daily_conversions 
  FOR SELECT 
  USING (true);

-- 5. Add policy for service role write
DROP POLICY IF EXISTS "Service role can insert/update daily conversions" ON daily_conversions;
CREATE POLICY "Service role can insert/update daily conversions"
  ON daily_conversions
  FOR ALL
 USING (auth.role() = 'service_role');

-- 6. Create atomic increment function
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

-- 7. Initialize today's record
INSERT INTO daily_conversions (conversion_date, total_wld_claimed, conversion_count)
VALUES (CURRENT_DATE, 0, 0)
ON CONFLICT (conversion_date) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify everything works:

SELECT * FROM daily_conversions ORDER BY conversion_date DESC LIMIT 1;

-- Expected: One row with today's date, 0 WLD claimed, 0 conversions
