const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// FORCE Load environment variables from .env.production
const envPath = path.resolve('/var/www/void-collector/.env.production');
if (fs.existsSync(envPath)) {
    console.log('[Campaign] Loading .env.production...');
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// CONFIG
const DB_CONNECTION = 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID;

const WAVES = {
    1: {
        title: '🔥 Double Rewards Event LIVE!',
        message: 'Earn 2X particles for the next 24h! Your uncollected particles are waiting — tap now before the event ends! 💰🚀'
    },
    2: {
        title: '💎 Your VIP Status is Waiting',
        message: 'Thousands of players already leveled up today! Check your VIP tier, spin the Slot Machine, and collect your WLD rewards! 🎰'
    },
    3: {
        title: '🏆 Weekend Contest — Win BIG!',
        message: 'Top 100 collectors get bonus WLD this weekend! Check your ranking on the leaderboard and start climbing! Can you reach #1? 🌌'
    }
};

async function main() {
    // Check for wave argument
    const waveArgIndex = process.argv.indexOf('--wave');
    const waveNum = waveArgIndex !== -1 ? parseInt(process.argv[waveArgIndex + 1]) : 1;

    console.log(`[Campaign] Selected Wave: ${waveNum}`);

    const config = WAVES[waveNum];
    if (!config) {
        console.error(`Invalid wave number: ${waveNum}`);
        process.exit(1);
    }

    console.log(`[Campaign] Title: ${config.title}`);

    if (!API_KEY) {
        console.error('[Campaign] Error: WORLDCOIN_API_KEY is missing via .env.production');
        process.exit(1);
    }

    console.log('[Campaign] Connecting to Postgres local...');
    const pool = new Pool({
        connectionString: DB_CONNECTION,
    });

    try {
        // 1. Fetch users
        console.log('[Campaign] Fetching users from Database...');

        const res = await pool.query('SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL');

        const wallets = res.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Campaign] Found ${wallets.length} valid wallet addresses.`);

        // 2. Send notifications
        const BATCH_SIZE = 1000;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);

            console.log(`[Campaign] Sending batch ${currentBatchNum}/${totalBatches}... (${batch.length} users)`);

            try {
                const res = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        app_id: APP_ID,
                        wallet_addresses: batch,
                        title: config.title,
                        message: config.message,
                        mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log(`✅ Batch ${currentBatchNum} sent:`, JSON.stringify(data));
                    sent += batch.length;
                } else {
                    const err = await res.text();
                    console.error(`❌ Batch ${currentBatchNum} failed:`, err);
                    failed += batch.length;
                }
            } catch (e) {
                console.error(`❌ Batch ${currentBatchNum} network error:`, e.message);
                failed += batch.length;
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`[Campaign] Finished! Sent: ${sent}, Failed: ${failed}`);

    } catch (err) {
        console.error('[Campaign] Database Error:', err);
    } finally {
        await pool.end();
    }
}

main();
