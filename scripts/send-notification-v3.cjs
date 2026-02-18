#!/usr/bin/env node

/**
 * Universal Mass Notification Sender v3
 * 
 * Usage:
 *   node scripts/send-notification-v3.cjs --title "Title" --message "Body"
 *   node scripts/send-notification-v3.cjs --title "Title" --message "Body" --dry-run
 *   node scripts/send-notification-v3.cjs   (uses default title/message)
 */

require('dotenv').config();
const { Pool } = require('pg');

// ─── CLI Args ───────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        title: null,
        message: null,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--title':
            case '-t':
                parsed.title = args[++i];
                break;
            case '--message':
            case '-m':
                parsed.message = args[++i];
                break;
            case '--dry-run':
            case '-d':
                parsed.dryRun = true;
                break;
            case '--help':
            case '-h':
                console.log(`
Usage: node send-notification-v3.cjs [options]

Options:
  --title, -t      Notification title (required or uses default)
  --message, -m    Notification body (required or uses default)
  --dry-run, -d    Preview without sending
  --help, -h       Show this help
                `);
                process.exit(0);
        }
    }
    return parsed;
}

// ─── Config ─────────────────────────────────────────────
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL;

const DEFAULT_TITLE = '🕳️ Void Collector Update';
const DEFAULT_MESSAGE = 'Something exciting is happening! Open the app to find out! 🚀';

if (!API_KEY) {
    console.error('[Notification] ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}
if (!DATABASE_URL) {
    console.error('[Notification] ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
}

async function sendMassNotification() {
    const { title, message, dryRun } = parseArgs();
    const finalTitle = title || DEFAULT_TITLE;
    const finalMessage = message || DEFAULT_MESSAGE;

    console.log(`[Notification] ═══════════════════════════════════════`);
    console.log(`[Notification] Title:    ${finalTitle}`);
    console.log(`[Notification] Message:  ${finalMessage}`);
    console.log(`[Notification] Dry-run:  ${dryRun ? 'YES (no notifications will be sent)' : 'NO (LIVE MODE)'}`);
    console.log(`[Notification] ═══════════════════════════════════════`);

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        console.log('[Notification] Fetching wallet addresses...');

        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Notification] Found ${wallets.length} valid wallets`);

        if (dryRun) {
            console.log(`[Notification] 🔍 DRY-RUN: Would send to ${wallets.length} wallets`);
            console.log(`[Notification] 🔍 DRY-RUN: ${Math.ceil(wallets.length / 1000)} batches of max 1000`);
            console.log(`[Notification] ✅ Dry-run complete. No notifications sent.`);
            return;
        }

        const BATCH_SIZE = 1000;
        let totalSent = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);
            console.log(`[Notification] Sending batch ${batchNum}/${totalBatches} (${batch.length} addresses)`);

            const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: APP_ID,
                    wallet_addresses: batch,
                    title: finalTitle,
                    message: finalMessage,
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[Notification] ✅ Batch ${batchNum} sent:`, data);
                totalSent += batch.length;
            } else {
                console.error(`[Notification] ❌ Batch ${batchNum} failed:`, data);
            }

            if (i + BATCH_SIZE < wallets.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`[Notification] ════════════════════════════════════`);
        console.log(`[Notification] ✅ Complete! Sent to ${totalSent}/${wallets.length} users`);

    } catch (error) {
        console.error('[Notification] Fatal error:', error);
    } finally {
        await pool.end();
    }
}

sendMassNotification();
