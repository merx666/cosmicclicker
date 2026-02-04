
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://merx@localhost:5432/void_collector',
    ssl: false,
});

async function checkPending() {
    try {
        const client = await pool.connect();

        console.log('Connected to DB');

        // Count pending
        const pendingRes = await client.query(`
            SELECT COUNT(*) as pending_count 
            FROM withdrawal_requests 
            WHERE status = 'pending'
        `);
        console.log('PENDING_COUNT:', pendingRes.rows[0].pending_count);

        // Get latest 5 pending to see dates
        const latestPending = await client.query(`
            SELECT id, user_id, wld_amount, created_at, status 
            FROM withdrawal_requests 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 5
        `);
        console.log('OLDEST_PENDING:', JSON.stringify(latestPending.rows, null, 2));

        // Get latest 5 processed (any status other than pending)
        const latestProcessed = await client.query(`
            SELECT id, wld_amount, status, created_at, processed_at, admin_note
            FROM withdrawal_requests 
            WHERE status IN ('paid', 'rejected', 'failed') 
            ORDER BY processed_at DESC 
            LIMIT 5
        `);
        console.log('LATEST_PROCESSED:', JSON.stringify(latestProcessed.rows, null, 2));

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

checkPending();
