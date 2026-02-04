#!/usr/bin/env node

const { Pool } = require('pg');

const API_KEY = 'api_a2V5XzE3YzBlOTE1ZDcxMDIxYzk4NWRmMTc0MjQ4ZGU5YmJiOnNrXzFhNzgxMGZhNDdhMWMzNmY3MDRiMTMyZjQyZmQ4MWZlMzg2ODBjYjQ0NzA4MzRjNg';
const APP_ID = 'app_e3c317455f168a14ab972dbe4f34ab9a';

async function sendMassNotification() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector'
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
                    title: '✅ App Fixed!',
                    message: 'Void Collector is now fully operational. All features are working correctly. Thank you for your patience!',
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
