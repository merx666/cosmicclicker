import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const supabaseUrl = 'https://wrruwhauyttrbgjrkcje.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzI4MywiZXhwIjoyMDgyNjUzMjgzfQ.7F9-zr3AbUw8HLdzkS8v4v_qmk5NL-n-dN9yzp_sDLM';

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
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: stmt + ';' })
            });
            if (res.ok) {
                console.log('✅ Success');
            } else {
                const text = await res.text();
                console.log('❌ Failed:', text);
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}
run();
