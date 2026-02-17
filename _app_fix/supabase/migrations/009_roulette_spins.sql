CREATE TABLE IF NOT EXISTS roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    world_id_nullifier VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255),
    cost_wld DECIMAL(10, 4) NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'vip' or 'particles'
    reward_value INTEGER NOT NULL, -- Tier level (1-4) or particle amount
    transaction_ref VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX idx_roulette_spins_user ON roulette_spins(world_id_nullifier);
CREATE INDEX idx_roulette_spins_date ON roulette_spins(created_at DESC);
