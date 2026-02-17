
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://merx@localhost:5432/postgres'
});

async function listTables() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in postgres database:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

listTables();
