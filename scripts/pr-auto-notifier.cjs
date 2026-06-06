#!/usr/bin/env node

/**
 * PR Auto Notifier — Automated 3x Daily PR Notifications
 * 
 * Usage:
 *   node scripts/pr-auto-notifier.cjs                  # Automatically determines wave based on current server hour
 *   node scripts/pr-auto-notifier.cjs --time morning   # Forces morning PR message
 *   node scripts/pr-auto-notifier.cjs --time afternoon # Forces afternoon PR message
 *   node scripts/pr-auto-notifier.cjs --time evening   # Forces evening PR message
 *   node scripts/pr-auto-notifier.cjs --dry-run        # Previews the notification without sending
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

// ============ PR NOTIFICATION MESSAGES ============
const PR_MESSAGES = {
    morning: {
        title: '🌌 2 Free Predictions!',
        message: 'Claim 2 free predictions daily by watching a quick ad! Predict WLD price trend and boost your balance with 25,000 particles! ⚡'
    },
    afternoon: {
        title: '🏆 Dominate the Leaderboard!',
        message: 'Upgrade your cosmic extractors and climb the rankings! Top collectors earn real WLD rewards! 💰🛸'
    },
    evening: {
        title: '🎰 Lucky Spin is Ready!',
        message: 'Your free daily bonus and Roulette spin are waiting. Enter now and expand your cosmic particle empire! 🌌🚀'
    }
};

if (!API_KEY) {
    console.error('[PR Notifier] ERROR: WORLDCOIN_API_KEY is not set');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('[PR Notifier] ERROR: DATABASE_URL is not set');
    process.exit(1);
}

function getSelectedTime() {
    // Check for forced time in CLI arguments
    const timeIdx = process.argv.indexOf('--time');
    if (timeIdx !== -1 && process.argv[timeIdx + 1]) {
        const forced = process.argv[timeIdx + 1].toLowerCase();
        if (PR_MESSAGES[forced]) {
            return forced;
        }
    }

    // Auto-detect based on current server hour (CET/CEST)
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
        return 'morning';
    } else if (hour >= 12 && hour < 18) {
        return 'afternoon';
    } else {
        return 'evening';
    }
}

async function run() {
    const timeSlot = getSelectedTime();
    const notification = PR_MESSAGES[timeSlot];

    console.log('[PR Notifier] =======================================');
    console.log(`[PR Notifier] Time Slot:  ${timeSlot.toUpperCase()}`);
    console.log(`[PR Notifier] Title:      ${notification.title}`);
    console.log(`[PR Notifier] Message:    ${notification.message}`);
    console.log(`[PR Notifier] Mode:       ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
    console.log('[PR Notifier] =======================================');

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        console.log('[PR Notifier] Fetching active users...');
        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[PR Notifier] Found ${wallets.length} target wallets`);

        if (wallets.length === 0) {
            console.log('[PR Notifier] No recipients found. Exiting.');
            return;
        }

        if (DRY_RUN) {
            console.log('[PR Notifier] 🔍 DRY RUN complete — no notifications sent');
            return;
        }

        const BATCH_SIZE = 1000;
        let totalSent = 0;
        let totalFailed = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);

            console.log(`[PR Notifier] Sending batch ${batchNum}/${totalBatches} (${batch.length} recipients)...`);

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
                    console.log(`[PR Notifier] ✅ Batch ${batchNum} sent successfully`);
                    totalSent += batch.length;
                } else {
                    console.error(`[PR Notifier] ❌ Batch ${batchNum} failed:`, JSON.stringify(data));
                    totalFailed += batch.length;
                }
            } catch (err) {
                console.error(`[PR Notifier] ❌ Batch ${batchNum} error:`, err.message);
                totalFailed += batch.length;
            }

            // Rate limit safety gap
            if (i + BATCH_SIZE < wallets.length) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        console.log('[PR Notifier] =======================================');
        console.log(`[PR Notifier] Summary: Sent: ${totalSent} | Failed: ${totalFailed}`);
        console.log('[PR Notifier] =======================================');

    } catch (err) {
        console.error('[PR Notifier] Fatal error during execution:', err);
    } finally {
        await pool.end();
    }
}

run();
