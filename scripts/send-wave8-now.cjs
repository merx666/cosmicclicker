#!/usr/bin/env node

/**
 * Emergency Wave 8 Mass Notification - Zero dependencies
 * Uses native fetch for both Supabase REST API and World notification API
 * Compatible with World ID 4.0
 */

const fs = require('fs');
const path = require('path');

// Load env from .env.local
function loadEnv(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        content.split('\n').forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    } catch (e) { }
}

loadEnv(path.resolve(__dirname, '..', '.env.local'));
loadEnv(path.resolve(__dirname, '..', '.env.production'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APP_ID = process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DRY_RUN = process.argv.includes('--dry-run');

// Wave 8 - Emergency PR re-engagement
const NOTIFICATION = {
    title: '⚡ Void Collector is EVOLVING!',
    message: 'Huge changes are coming! Collect particles NOW before the big reset — early collectors get exclusive bonuses! Don\'t miss your chance! 🌌🔥'
};

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[Wave8] Missing Supabase config!');
    console.error('SUPABASE_URL:', !!SUPABASE_URL, SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING');
    console.error('SUPABASE_KEY:', !!SUPABASE_KEY);
    process.exit(1);
}

async function fetchAllWallets() {
    let allWallets = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const url = `${SUPABASE_URL}/rest/v1/users?select=wallet_address&wallet_address=not.is.null&offset=${offset}&limit=${limit}`;

        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[Wave8] Supabase error (${res.status}):`, err);
            process.exit(1);
        }

        const users = await res.json();
        if (users && users.length > 0) {
            allWallets = allWallets.concat(users);
            offset += limit;
        } else {
            hasMore = false;
        }
    }

    return allWallets
        .map(u => u.wallet_address)
        .filter(w => w && w.length === 42 && w.startsWith('0x'));
}

async function main() {
    console.log('[Wave8] ═══════════════════════════════════════');
    console.log(`[Wave8] Title:   ${NOTIFICATION.title}`);
    console.log(`[Wave8] Message: ${NOTIFICATION.message}`);
    console.log(`[Wave8] App ID:  ${APP_ID}`);
    console.log(`[Wave8] Mode:    ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
    console.log('[Wave8] ═══════════════════════════════════════');

    const wallets = await fetchAllWallets();
    console.log(`[Wave8] Found ${wallets.length} valid wallet addresses`);

    if (DRY_RUN) {
        console.log(`[Wave8] 🔍 DRY RUN — would send to ${wallets.length} users`);
        console.log(`[Wave8] 🔍 Sample: ${wallets.slice(0, 3).join(', ')}`);
        console.log(`[Wave8] 🔍 Batches: ${Math.ceil(wallets.length / 1000)}`);
        return;
    }

    const BATCH_SIZE = 1000;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
        const batch = wallets.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);

        console.log(`[Wave8] Sending batch ${batchNum}/${totalBatches} (${batch.length} addresses)...`);

        try {
            // Try new API endpoint first (developer.world.org)
            let response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: APP_ID,
                    wallet_addresses: batch,
                    title: NOTIFICATION.title,
                    message: NOTIFICATION.message,
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            let data = await response.json();

            if (response.ok) {
                console.log(`[Wave8] ✅ Batch ${batchNum} sent:`, JSON.stringify(data).substring(0, 200));
                totalSent += batch.length;
            } else {
                console.error(`[Wave8] ❌ Batch ${batchNum} failed (${response.status}):`, JSON.stringify(data).substring(0, 300));

                // If failed, try developer.world.org endpoint
                if (response.status === 401 || response.status === 403 || response.status >= 400) {
                    console.log(`[Wave8] ⚠️ Trying alternate endpoint developer.world.org...`);
                    response = await fetch('https://developer.world.org/api/v2/minikit/send-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            app_id: APP_ID,
                            wallet_addresses: batch,
                            title: NOTIFICATION.title,
                            message: NOTIFICATION.message,
                            mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                        })
                    });
                    data = await response.json();
                    if (response.ok) {
                        console.log(`[Wave8] ✅ Alt endpoint batch ${batchNum} sent:`, JSON.stringify(data).substring(0, 200));
                        totalSent += batch.length;
                    } else {
                        console.error(`[Wave8] ❌ Alt endpoint also failed (${response.status}):`, JSON.stringify(data).substring(0, 300));
                        totalFailed += batch.length;
                    }
                } else {
                    totalFailed += batch.length;
                }
            }
        } catch (err) {
            console.error(`[Wave8] ❌ Batch ${batchNum} error:`, err.message);
            totalFailed += batch.length;
        }

        if (i + BATCH_SIZE < wallets.length) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    console.log('[Wave8] ═══════════════════════════════════════');
    console.log(`[Wave8] ✅ Sent: ${totalSent} | ❌ Failed: ${totalFailed}`);
    console.log('[Wave8] ═══════════════════════════════════════');
}

main().catch(err => {
    console.error('[Wave8] Fatal error:', err);
    process.exit(1);
});
