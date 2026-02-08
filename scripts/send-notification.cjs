#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

// Load secrets from environment variables
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
    console.error('[Notification] ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('[Notification] ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
}

async function sendMassNotification() {
    const pool = new Pool({
        connectionString: DATABASE_URL
    });

    try {
        console.log('[Notification] Fetching wallet addresses...');

        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        // Filter only valid Ethereum addresses (exactly 42 chars, starts with 0x)
        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Notification] Found ${wallets.length} valid wallets`);

        // World API allows max 1000 addresses per request, so we batch
        const BATCH_SIZE = 1000;
        let totalSent = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            console.log(`[Notification] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wallets.length / BATCH_SIZE)} (${batch.length} addresses)`);

            const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: APP_ID,
                    wallet_addresses: batch,
                    title: '💎 Market Dip Opportunity',
                    message: 'While the market restricts, Void Collector expands! 🚀 Best time to upgrade to VIP and maximize your earnings. Secure your spot now!',
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[Notification] Batch sent successfully:`, data);
                totalSent += batch.length;
            } else {
                console.error(`[Notification] Batch failed:`, data);
            }

            // Small delay between batches
            if (i + BATCH_SIZE < wallets.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`[Notification] ✅ Complete! Sent to ${totalSent} users`);

    } catch (error) {
        console.error('[Notification] Error:', error);
    } finally {
        await pool.end();
    }
}

sendMassNotification();
