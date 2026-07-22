import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env relative to this script
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector',
    ssl: false,
});

async function runReset() {
    console.log('🚀 Starting Season 4 Database Reset...');
    
    try {
        const { rows: users } = await pool.query('SELECT world_id_nullifier, unlocked_skins FROM users');
        console.log(`Found ${users.length} users to process.`);

        for (const user of users) {
            let skins: string[] = [];
            try {
                if (typeof user.unlocked_skins === 'string') {
                    skins = JSON.parse(user.unlocked_skins);
                } else if (Array.isArray(user.unlocked_skins)) {
                    skins = user.unlocked_skins;
                }
            } catch (e) {
                // Ignore parse errors
            }

            // Grant season3_veteran badge
            if (!skins.includes('season3_veteran')) {
                skins.push('season3_veteran');
            }

            await pool.query(`
                UPDATE users 
                SET 
                    particles = 0,
                    particles_per_click = 1,
                    particles_per_second = 0,
                    total_clicks = 0,
                    total_particles_collected = 0,
                    total_passive_particles = 0,
                    upgrade_click_power = 0,
                    upgrade_auto_collector = 0,
                    upgrade_multiplier = 0,
                    upgrade_offline = 0,
                    daily_clicks = 0,
                    daily_passive_particles = 0,
                    daily_particles_collected = 0,
                    bp_level = 0,
                    bp_xp = 0,
                    bp_claimed_free = '[]',
                    bp_claimed_premium = '[]',
                    hourly_clicks = 0,
                    unlocked_skins = $1,
                    updated_at = NOW()
                WHERE world_id_nullifier = $2
            `, [JSON.stringify(skins), user.world_id_nullifier]);
        }

        console.log('✅ Season 4 Database Reset completed successfully.');
    } catch (error) {
        console.error('❌ Error during reset:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runReset();
