-- Tier purchases transaction log
CREATE TABLE IF NOT EXISTS tier_purchases (
    id SERIAL PRIMARY KEY,
    world_id_nullifier VARCHAR(255) NOT NULL,
    tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_ref VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_purchases_nullifier ON tier_purchases(world_id_nullifier);
CREATE INDEX IF NOT EXISTS idx_tier_purchases_created ON tier_purchases(created_at DESC);

-- Comment
COMMENT ON TABLE tier_purchases IS 'Transaction log for VIP tier purchases';
