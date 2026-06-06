#!/usr/bin/env node

/**
 * Compensation & Notification Script
 * Credits +150k particles to all users and sends a mass notification.
 */

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
    console.log('[Compensate] Loading .env.production...');
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const { Pool } = require('pg');

const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

const COMPENSATION_PARTICLES = 150000;

const NOTIFICATION_TITLE = '⚡ We are back online!';
const NOTIFICATION_MESSAGE = 'Due to recent DDoS attacks, some players experienced connection issues. We have successfully mitigated the attacks and restored full service. To thank you for your patience, we have credited 150,000 Particles to your balance! 🚀';

if (!API_KEY) {
    console.error('[Compensate] ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}

async function runCompensation() {
    console.log('[Compensate] Starting compensation script...');
    console.log(`[Compensate] Database URL: ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}`);
    
    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        // 1. Database Update
        console.log('[Compensate] Crediting +150,000 particles to all users...');
        const updateResult = await pool.query(
            'UPDATE users SET particles = particles + $1, total_particles_collected = total_particles_collected + $1',
            [COMPENSATION_PARTICLES]
        );
        console.log(`[Compensate] Database updated successfully. Rows affected: ${updateResult.rowCount}`);

        // 2. Fetch wallets for notification
        console.log('[Compensate] Fetching wallet addresses...');
        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );

        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        console.log(`[Compensate] Found ${wallets.length} valid wallets`);

        if (wallets.length === 0) {
            console.log('[Compensate] No valid wallets found. Skipping notification.');
            return;
        }

        const BATCH_SIZE = 1000;
        let totalSent = 0;

        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);
            console.log(`[Compensate] Sending notification batch ${batchNum}/${totalBatches} (${batch.length} addresses)`);

            const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    app_id: APP_ID,
                    wallet_addresses: batch,
                    title: NOTIFICATION_TITLE,
                    message: NOTIFICATION_MESSAGE,
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[Compensate] ✅ Batch ${batchNum} sent successfully:`, data);
                totalSent += batch.length;
            } else {
                console.error(`[Compensate] ❌ Batch ${batchNum} failed:`, data);
            }

            if (i + BATCH_SIZE < wallets.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`[Compensate] ✅ Complete! Sent to ${totalSent}/${wallets.length} users`);

    } catch (error) {
        console.error('[Compensate] Fatal error:', error);
    } finally {
        await pool.end();
    }
}

runCompensation();
