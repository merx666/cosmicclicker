-- Migration: Withdrawal Requests (Semi-automatic WLD payouts)
-- Purpose: Track user withdrawal requests for manual processing

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL, -- User's World Chain wallet address
  wld_amount DECIMAL(10, 4) NOT NULL DEFAULT 0.01,
  particles_spent BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  transaction_hash TEXT, -- To store blockchain transaction ID after payment
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Constraint to ensure minimal amount
  CONSTRAINT min_wld_amount CHECK (wld_amount > 0),
  -- Constraint to ensure positive particles spent
  CONSTRAINT min_particles_spent CHECK (particles_spent > 0)
);

-- Indexes
CREATE INDEX idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawals_created ON withdrawal_requests(created_at DESC);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can see their own requests
CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests
  FOR SELECT
  USING (auth.uid() = user_id); -- Note: dependent on Supabase Auth, but we use custom logic. 
  -- IF we are using custom auth (checking user_id passed in query), we might need to adjust.
  -- For now, let's allow public read if filter matches (or rely on Service Role for API).
  -- ACTUALLY: Since we use Service Role in API for almost everything in this project (based on convert-wld route),
  -- we can strict this significantly or just rely on the API layer for security if RLS is tricky with custom auth.
  -- Let's stick to Service Role for mutations.

-- 2. Service Role has full access (API)
CREATE POLICY "Service role full access withdrawals"
  ON withdrawal_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE withdrawal_requests IS 'Queue for manual WLD withdrawal processing';
