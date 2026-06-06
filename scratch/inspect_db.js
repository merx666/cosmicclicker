import pkg from 'pg';
const { Client } = pkg;

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector'
    });
    await client.connect();

    // 1. List columns of 'users' table
    const usersCols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
    `);
    console.log('--- USERS TABLE COLUMNS ---');
    usersCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    // 2. List tables in the database
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    console.log('--- ALL TABLES ---');
    tables.rows.forEach(r => console.log(r.table_name));

    await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
