-- Migration: 011_void_predictions.sql
-- Description: Create tables for Web3 Price Predictions mini-game

CREATE TABLE IF NOT EXISTS predictions_rounds (
    id SERIAL PRIMARY KEY,
    epoch INT NOT NULL UNIQUE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    lock_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    lock_price DECIMAL(20, 8),
    end_price DECIMAL(20, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'locked', 'ended', 'cancelled'
    outcome VARCHAR(10), -- 'up', 'down', 'draw'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictions_bets (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES predictions_rounds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 2) NOT NULL,
    position VARCHAR(10) NOT NULL, -- 'up', 'down'
    is_free_ad BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    payout DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_bets_user ON predictions_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_rounds_epoch ON predictions_rounds(epoch);
