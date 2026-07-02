ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_clicks INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_click_hour_reset TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bypass_until TIMESTAMP;

CREATE TABLE IF NOT EXISTS minikit_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_nullifier VARCHAR(255) NOT NULL,
    amount NUMERIC NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
