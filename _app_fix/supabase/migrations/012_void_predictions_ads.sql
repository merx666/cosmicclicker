-- Migration: 012_void_predictions_ads.sql
-- Description: Create table for tracking verified free ad prediction claims

CREATE TABLE IF NOT EXISTS predictions_ad_claims (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'used'
);

CREATE INDEX IF NOT EXISTS idx_predictions_ad_claims_user ON predictions_ad_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ad_claims_clicked ON predictions_ad_claims(clicked_at);
