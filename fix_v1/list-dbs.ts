
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://merx@localhost:5432/postgres'
});

async function list() {
    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
        console.log('Databases:', res.rows.map(r => r.datname));
        await client.end();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

list();
