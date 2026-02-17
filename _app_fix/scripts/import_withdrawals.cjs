
const fs = require('fs');
const { Pool } = require('pg');

async function run() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector'
    });

    try {
        if (!fs.existsSync('/tmp/supabase_withdrawals.json')) {
            console.log('No withdrawal export file found /tmp/supabase_withdrawals.json');
            return;
        }

        const withdrawals = JSON.parse(fs.readFileSync('/tmp/supabase_withdrawals.json', 'utf8'));
        console.log(`Checking ${withdrawals.length} withdrawals from export...`);

        for (const w of withdrawals) {
            const exists = await pool.query('SELECT id FROM withdrawal_requests WHERE id = $1', [w.id]);
            if (exists.rows.length === 0) {
                await pool.query(
                    'INSERT INTO withdrawal_requests (id, user_id, wallet_address, wld_amount, particles_spent, status, transaction_hash, admin_note, created_at, processed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [w.id, w.user_id, w.wallet_address, w.wld_amount, w.particles_spent, w.status, w.transaction_hash, w.admin_note, w.created_at, w.processed_at]
                );
                console.log(`IMPORTED: ${w.id} (${w.wld_amount} WLD)`);
            } else {
                console.log(`EXISTS: ${w.id}`);
            }
        }
    } catch (e) {
        console.error('Import Error:', e);
    } finally {
        await pool.end();
    }
}

run();
