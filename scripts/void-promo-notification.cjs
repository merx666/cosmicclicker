const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/void-collector/.env.production' });

// Configuration
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';

// Use fallback if DATABASE_URL is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

if (!API_KEY) {
    console.error('[Notification] ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}

// Simple check for SSL requirement
const useSSL = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');

// --- THE MESSAGE ---
const TITLE = '🌌 VOID CLUB IS LIVE';
const BODY = 'The future is here. Hold $VOID to unlock VIP powers instantly. No payments, just HODL. Check your status now in the Premium Shop. 🚀';
const TARGET_PATH = '/tabs/premium';

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

        // Filter valid addresses
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
                // Determine Auth Header
                let authHeader;
                if (API_KEY.includes(':') && !API_KEY.startsWith('Basic')) {
                    // It's a key:secret pair, use Basic Auth
                    const base64Creds = Buffer.from(API_KEY).toString('base64');
                    authHeader = `Basic ${base64Creds}`;
                } else if (API_KEY.startsWith('Basic ')) {
                    // Already formatted
                    authHeader = API_KEY;
                } else {
                    // Fallback: Assume it's a Bearer token (JWT or similar)
                    // But if it looks like base64 characters only, it might be pre-encoded Basic
                    // For safety, default to Bearer unless it has a colon.
                    authHeader = `Bearer ${API_KEY}`;
                }

                // Debug log (masking key)
                console.log(`[DEBUG] Using Auth Header start: ${authHeader.substring(0, 15)}...`);

                const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        app_id: APP_ID,
                        wallet_addresses: batch,
                        title: TITLE,
                        message: BODY,
                        mini_app_path: `worldapp://mini-app?app_id=${APP_ID}&path=${TARGET_PATH}`
                    })
                });

                if (response.ok) {
                    console.log(`[Notification] Batch sent successfully`);
                    totalSent += batch.length;
                } else {
                    // 404 with "API key not found" usually means Auth failed.
                    const errorText = await response.text();
                    console.log(`[Notification] Response status: ${response.status}`);
                    console.error(`[Notification] Batch failed:`, errorText);
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
