#!/usr/bin/env node

/**
 * Campaign Mass Notification Script
 * Multi-wave notification system for Void Collector marketing campaigns
 * 
 * Usage:
 *   node scripts/campaign-notifications.cjs --wave 1           # Send wave 1
 *   node scripts/campaign-notifications.cjs --wave 2           # Send wave 2
 *   node scripts/campaign-notifications.cjs --wave 3           # Send wave 3
 *   node scripts/campaign-notifications.cjs --custom "Title" "Message"  # Custom
 *   node scripts/campaign-notifications.cjs --dry-run --wave 1 # Preview only
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.WORLDCOIN_API_KEY || !process.env.DATABASE_URL) {
    require('dotenv').config({ path: '.env.production' });
}
const { Pool } = require('pg');

const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';
const DRY_RUN = process.argv.includes('--dry-run');

// ============ CAMPAIGN WAVES ============
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
    },
    4: {
        title: '⚡ Payouts Accelerated!',
        message: 'Withdrawals now process faster than ever! Convert your particles to WLD and cash out instantly. The system is running at full speed! 💸'
    },
    5: {
        title: '🌌 New Features Unlocked!',
        message: 'Major update just dropped! New missions, upgraded Slot Machine, and better VIP rewards. Open the app to explore! 🎯'
    },
    6: {
        title: '🚨 $500 VOID Giveaway!',
        message: 'We\'re dropping $500 in $VOID with PUF Wallet! Download PUF WALLET app, follow @Void_WorldApp & @PufLaunch, Like & RT our pinned post. Winners in 48h! Open app now! 🏆🔥'
    },
    7: {
        title: '🚀 Big Void Update!',
        message: 'New features are live! Deploy Ad Banners with WLD, unlock powerful Premium Upgrades, and conquer harder Daily Missions to earn massive rewards! Open the app now! ⚡'
    },
    8: {
        title: '⚡ Void Collector is EVOLVING!',
        message: 'Huge changes are coming! Collect particles NOW before the big reset — early collectors get exclusive bonuses! Don\'t miss your chance! 🌌🔥'
    }
};

if (!API_KEY) {
    console.error('[Campaign] ERROR: WORLDCOIN_API_KEY not set in .env.local');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('[Campaign] ERROR: DATABASE_URL not set in .env.local');
    process.exit(1);
}

function getNotification() {
    // Check for wave argument
    const waveIdx = process.argv.indexOf('--wave');
    if (waveIdx !== -1 && process.argv[waveIdx + 1]) {
        const waveNum = parseInt(process.argv[waveIdx + 1]);
        if (WAVES[waveNum]) {
            console.log(`[Campaign] Using Wave ${waveNum}`);
            return WAVES[waveNum];
        } else {
            console.error(`[Campaign] Invalid wave number: ${waveNum}. Available: ${Object.keys(WAVES).join(', ')}`);
            process.exit(1);
        }
    }

    // Check for custom message
    const customIdx = process.argv.indexOf('--custom');
    if (customIdx !== -1 && process.argv[customIdx + 1] && process.argv[customIdx + 2]) {
        return {
            title: process.argv[customIdx + 1],
            message: process.argv[customIdx + 2]
        };
    }

    console.error('[Campaign] Usage:');
    console.error('  node campaign-notifications.cjs --wave <1-5>');
    console.error('  node campaign-notifications.cjs --custom "Title" "Message"');
    console.error('  Add --dry-run to preview without sending');
    process.exit(1);
}

async function sendCampaign() {
    const notification = getNotification();

    console.log('[Campaign] ====================================');
    console.log(`[Campaign] Title: ${notification.title}`);
    console.log(`[Campaign] Message: ${notification.message}`);
    console.log(`[Campaign] Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
    console.log('[Campaign] ====================================');

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Campaign] Found ${wallets.length} valid wallet addresses`);

        if (DRY_RUN) {
            console.log('[Campaign] 🔍 DRY RUN — would send to', wallets.length, 'users');
            console.log('[Campaign] Sample wallets:', wallets.slice(0, 3).join(', '));
            return;
        }

        const BATCH_SIZE = 1000;
        let totalSent = 0;
        let totalFailed = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);

            console.log(`[Campaign] Batch ${batchNum}/${totalBatches} (${batch.length} addresses)...`);

            try {
                const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        app_id: APP_ID,
                        wallet_addresses: batch,
                        title: notification.title,
                        message: notification.message,
                        mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log(`[Campaign] ✅ Batch ${batchNum} sent:`, JSON.stringify(data));
                    totalSent += batch.length;
                } else {
                    console.error(`[Campaign] ❌ Batch ${batchNum} failed:`, JSON.stringify(data));
                    totalFailed += batch.length;
                }
            } catch (err) {
                console.error(`[Campaign] ❌ Batch ${batchNum} error:`, err.message);
                totalFailed += batch.length;
            }

            // Delay between batches
            if (i + BATCH_SIZE < wallets.length) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        console.log('[Campaign] ====================================');
        console.log(`[Campaign] ✅ Sent: ${totalSent} | ❌ Failed: ${totalFailed}`);
        console.log('[Campaign] ====================================');

    } catch (err) {
        console.error('[Campaign] Fatal error:', err);
    } finally {
        await pool.end();
    }
}

sendCampaign();
