-- Migration 014: Telegram Payments
-- Add currency and original currency price columns to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'WLD';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS price_in_currency DECIMAL(18, 8);

-- Make transaction_hash unique to prevent duplicate processing of the same payment hash (Stars or TON tx)
-- We use a partial unique index because transaction_hash can be NULL for dev/mock purchases.
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_unique_tx_hash ON purchases(transaction_hash) WHERE transaction_hash IS NOT NULL;
