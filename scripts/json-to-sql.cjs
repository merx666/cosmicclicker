const fs = require('fs');
const users = JSON.parse(fs.readFileSync('/tmp/supabase_users_export.json', 'utf-8'));
let sql = 'BEGIN;\n';

for (const u of users) {
    const id = u.id;
    const wn = (u.world_id_nullifier || '').replace(/'/g, "''");
    const p = u.particles || 0;
    const tpc = u.total_particles_collected || 0;
    const tc = u.total_clicks || 0;
    const wa = (u.wallet_address || u.world_id_nullifier || '').replace(/'/g, "''");

    sql += `INSERT INTO users (id, world_id_nullifier, particles, total_particles_collected, total_clicks, wallet_address) VALUES ('${id}', '${wn}', ${p}, ${tpc}, ${tc}, '${wa}') ON CONFLICT (world_id_nullifier) DO UPDATE SET particles = ${p}, total_particles_collected = ${tpc}, total_clicks = ${tc};\n`;
}

sql += 'COMMIT;\n';
fs.writeFileSync('/tmp/import_users.sql', sql);
console.log('Generated SQL with', users.length, 'users');
