
import pg from 'pg';
const { Client } = pg;

// Use the credentials found in docker-compose.yml
const connectionString = 'postgresql://postgres:VoidCollectorDB2024!@127.0.0.1:5432/void_collector';

console.log('Testing connection to:', connectionString);

const client = new Client({
    connectionString: connectionString
});

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT count(*) FROM withdrawal_requests WHERE status = \'pending\'');
        console.log('Pending withdrawals:', res.rows[0].count);
        await client.end();
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
        if (e.code) console.error('Error code:', e.code);
        process.exit(1);
    }
}

testConnection();
