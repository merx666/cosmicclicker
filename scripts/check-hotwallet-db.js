const { getHotWalletBalance, getHotWalletAddress } = require('../lib/payout');
const { query } = require('../lib/db');

async function run() {
    try {
        console.log('--- Hot Wallet Status ---');
        const address = getHotWalletAddress();
        const balance = await getHotWalletBalance();
        console.log(`Address: ${address}`);
        console.log(`Balance: ${balance} WLD`);

        console.log('\n--- Withdrawal Requests Summary ---');
        const stats = await query(`
            SELECT status, COUNT(*)::int as count, COALESCE(SUM(amount), 0)::float as total_amount 
            FROM withdrawal_requests 
            GROUP BY status
        `);
        console.table(stats.rows);

        console.log('\n--- Recent Pending Withdrawals ---');
        const pending = await query(`
            SELECT wr.id, u.username, wr.amount, wr.status, wr.created_at
            FROM withdrawal_requests wr
            LEFT JOIN users u ON wr.user_id = u.id
            WHERE wr.status = 'pending'
            ORDER BY wr.created_at DESC
            LIMIT 5
        `);
        console.table(pending.rows);
    } catch (error) {
        console.error('Error checking status:', error);
    } finally {
        process.exit(0);
    }
}

run();
