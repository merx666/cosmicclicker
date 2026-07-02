ALTER TABLE users ALTER COLUMN last_click_hour_reset TYPE TIMESTAMPTZ USING last_click_hour_reset AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN bypass_until TYPE TIMESTAMPTZ USING bypass_until AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN last_daily_reset TYPE TIMESTAMPTZ USING last_daily_reset AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN last_daily_bonus_time TYPE TIMESTAMPTZ USING last_daily_bonus_time AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN last_claim_time TYPE TIMESTAMPTZ USING last_claim_time AT TIME ZONE 'UTC';
