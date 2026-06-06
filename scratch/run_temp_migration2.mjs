import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://wrruwhauyttrbgjrkcje.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzI4MywiZXhwIjoyMDgyNjUzMjgzfQ.7F9-zr3AbUw8HLdzkS8v4v_qmk5NL-n-dN9yzp_sDLM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlContent = `
CREATE TABLE IF NOT EXISTS predictions_ad_claims (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_predictions_ad_claims_user ON predictions_ad_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ad_claims_clicked ON predictions_ad_claims(clicked_at);
`;

const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

async function run() {
    for (const stmt of statements) {
        if (!stmt) continue;
        console.log(`Executing statement: ${stmt.substring(0, 80)}...`);
        try {
            // Try running it via the Supabase client rpc 'exec_sql'
            const { data, error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
            if (error) {
                console.log('❌ Error via RPC:', error.message);
            } else {
                console.log('✅ Success');
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}
run();
