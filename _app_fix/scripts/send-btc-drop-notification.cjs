const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/void-collector/.env.production' });

const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';

// Use fallback if DATABASE_URL is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

if (!API_KEY) {
    console.error('[Notification] ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}

// Simple check for SSL requirement (usually Supabase/Remote needs it, Localhost doesn't)
const useSSL = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');

const TITLE = 'BTC Drop: 100 WLD Giveaway! 📉';
const BODY = 'Bitcoin is down, but we are giving away 100 WLD! 💰 Go to MEDIA tab and click on X to join! 🚀';

async function sendMassNotification() {
    console.log(`[Notification] Connecting to DB... (SSL: ${useSSL})`);

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined
    });

    try {
        console.log('[Notification] Fetching unique wallet addresses...');

        const result = await pool.query(
            'SELECT DISTINCT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Notification] Found ${wallets.length} valid unique wallets`);

        const BATCH_SIZE = 500;
        let totalSent = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            console.log(`[Notification] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wallets.length / BATCH_SIZE)} (${batch.length} addresses)`);

            try {
                const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        app_id: APP_ID,
                        wallet_addresses: batch, // Changed from target_wallets
                        title: TITLE,
                        message: BODY, // Changed from body
                        mini_app_path: `worldapp://mini-app?app_id=${APP_ID}&path=/tabs/media`
                    })
                });

                if (response.ok) {
                    console.log(`[Notification] Batch sent successfully`);
                    totalSent += batch.length;
                } else {
                    const errorText = await response.text();
                    console.error(`[Notification] Batch failed: ${response.status}`, errorText);
                }
            } catch (error) {
                console.error(`[Notification] Network error in batch:`, error);
            }

            // Rate limit protection
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[Notification] ✅ Complete! Sent to ~${totalSent} users`);

    } catch (error) {
        console.error('[Notification] Database Error:', error);
    } finally {
        await pool.end();
    }
}

sendMassNotification();
