const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load .env if present

// FORCE Load environment variables from .env.production
const envPath = path.resolve('/var/www/void-collector/.env.production');
if (fs.existsSync(envPath)) {
    console.log('[Campaign] Loading .env.production...');
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Must use SERVICE_KEY for admin access
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
    const waveArgIndex = process.argv.indexOf('--wave');
    const waveNum = waveArgIndex !== -1 ? parseInt(process.argv[waveArgIndex + 1]) : 1;

    console.log(`[Campaign] Selected Wave: ${waveNum}`);

    const config = WAVES[waveNum];
    if (!config) {
        console.error(`Invalid wave number: ${waveNum}`);
        process.exit(1);
    }

    console.log(`[Campaign] Title: ${config.title}`);

    if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
        console.error('Missing env vars! Check .env.production');
        console.error('SUPABASE_URL:', !!SUPABASE_URL);
        console.error('SUPABASE_KEY:', !!SUPABASE_KEY);
        console.error('API_KEY:', !!API_KEY);
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fetch users
    console.log('[Campaign] Fetching users from Supabase...');

    // Pagination for fetching users
    let allUsers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data: users, error } = await supabase
            .from('users')
            .select('wallet_address')
            .not('wallet_address', 'is', null)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Supabase error:', error);
            process.exit(1);
        }

        if (users && users.length > 0) {
            allUsers = allUsers.concat(users);
            page++;
            // Optional: Log progress
            // console.log(`Fetched ${allUsers.length} users...`);
        } else {
            hasMore = false;
        }
    }

    const wallets = allUsers
        .map(u => u.wallet_address)
        .filter(w => w && w.length === 42 && w.startsWith('0x'));

    console.log(`[Campaign] Found ${wallets.length} valid wallet addresses.`);

    // 2. Send notifications
    const BATCH_SIZE = 500;
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
                // Handle 400 Bad Request (likely limit exceeded or bad tokens)
                // If specific addresses failed, the batch might partly fail? API dependent.
                console.error(`❌ Batch ${currentBatchNum} failed:`, err);
                failed += batch.length;
            }
        } catch (e) {
            console.error(`❌ Batch ${currentBatchNum} network error:`, e.message);
            failed += batch.length;
        }

        // Rate limiting - be gentle
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[Campaign] Finished! Sent: ${sent}, Failed: ${failed}`);
}

main();
