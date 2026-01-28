import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost/void_collector',
});

await client.connect();
console.log('Connected to PostgreSQL');

async function importUsers() {
    const users = JSON.parse(fs.readFileSync('/tmp/supabase_users_export.json', 'utf-8'));
    console.log('Importing', users.length, 'users...');

    let imported = 0;
    let updated = 0;

    for (const u of users) {
        try {
            // Check if user exists
            const existing = await client.query('SELECT id FROM users WHERE world_id_nullifier = $1', [u.world_id_nullifier]);

            if (existing.rows.length > 0) {
                // Update existing user with all data
                await client.query(`
          UPDATE users SET 
            particles = $1, 
            total_particles_collected = $2, 
            total_clicks = $3, 
            wallet_address = $4,
            total_passive_particles = $5,
            particles_per_click = $6,
            particles_per_second = $7,
            upgrade_click_power = $8,
            upgrade_auto_collector = $9,
            upgrade_multiplier = $10,
            upgrade_offline = $11,
            total_wld_claimed = $12,
            last_claim_time = $13,
            updated_at = NOW()
          WHERE world_id_nullifier = $14`,
                    [
                        u.particles,
                        u.total_particles_collected,
                        u.total_clicks,
                        u.wallet_address || u.world_id_nullifier,
                        u.total_passive_particles || 0,
                        u.particles_per_click || 1,
                        u.particles_per_second || 0,
                        u.upgrade_click_power || 1,
                        u.upgrade_auto_collector || 0,
                        u.upgrade_multiplier || 1,
                        u.upgrade_offline || 0,
                        u.total_wld_claimed || 0,
                        u.last_claim_time,
                        u.world_id_nullifier
                    ]
                );
                updated++;
            } else {
                // Insert new user
                await client.query(`
          INSERT INTO users (
            id, world_id_nullifier, particles, total_particles_collected, 
            total_clicks, wallet_address, total_passive_particles,
            particles_per_click, particles_per_second, upgrade_click_power,
            upgrade_auto_collector, upgrade_multiplier, upgrade_offline,
            total_wld_claimed, last_claim_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        u.id, u.world_id_nullifier, u.particles, u.total_particles_collected,
                        u.total_clicks, u.wallet_address || u.world_id_nullifier, u.total_passive_particles || 0,
                        u.particles_per_click || 1, u.particles_per_second || 0, u.upgrade_click_power || 1,
                        u.upgrade_auto_collector || 0, u.upgrade_multiplier || 1, u.upgrade_offline || 0,
                        u.total_wld_claimed || 0, u.last_claim_time, u.created_at, u.updated_at
                    ]
                );
                imported++;
            }

            if ((imported + updated) % 100 === 0) {
                console.log('Progress:', imported + updated, '/', users.length);
            }
        } catch (err) {
            console.error('Error for user', u.id, err.message);
        }
    }

    console.log('Done! Imported:', imported, 'Updated:', updated);
    await client.end();
}

importUsers();
