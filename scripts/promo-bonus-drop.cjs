const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/void-collector/.env.production' });

// Configuration
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

const BONUS_AMOUNT = 0.1;
const WINNERS_COUNT = 20;

// Notification Content
const TITLE = '🌟 200 USERS REWARDED!';
const BODY = 'We just sent a WLD bonus to 200 random active users! 🎁 Are you one of them? Rate us 5 stars to qualify for the next drop! ⭐⭐⭐⭐⭐';
const TARGET_PATH = '/tabs/premium'; // Direct them to premium/wallet

// Check args
const isDryRun = process.argv.includes('--dry-run');
const skipNotify = process.argv.includes('--skip-notify') || process.argv.includes('--payout-only');
const skipPayout = process.argv.includes('--notify-only');

if (!API_KEY) {
    console.error('❌ ERROR: WORLDCOIN_API_KEY environment variable is required');
    process.exit(1);
}

// Simple check for SSL requirement
const useSSL = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');

async function main() {
    console.log(`\n🚀 STARTING PROMO BONUS DROP ${isDryRun ? '(DRY RUN)' : ''}`);
    console.log(`--------------------------------------------------`);

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined
    });

    try {
        // 1. GET ALL VALID USERS
        console.log('🔍 Fetching valid users...');
        const res = await pool.query(
            `SELECT id, wallet_address FROM users 
             WHERE wallet_address IS NOT NULL 
             AND LENGTH(wallet_address) = 42 
             AND wallet_address LIKE '0x%'`
        );

        const allUsers = res.rows;
        console.log(`✅ Found ${allUsers.length} valid users.`);

        if (allUsers.length < WINNERS_COUNT) {
            console.error('❌ Not enough users to select winners.');
            process.exit(1);
        }

        // 2. SELECT RANDOM WINNERS
        // Shuffle array
        const shuffled = allUsers.sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, WINNERS_COUNT);

        console.log(`\n🎰 Selected ${winners.length} Winners:`);
        winners.forEach((w, i) => console.log(`   ${i + 1}. ${w.wallet_address} (ID: ${w.id})`));

        // 3. PROCESS PAYOUTS
        if (!skipPayout) {
            console.log(`\n💸 Processing ${WINNERS_COUNT} x ${BONUS_AMOUNT} WLD payouts...`);

            if (isDryRun) {
                console.log('   [DRY RUN] Would insert withdrawal_requests here.');
            } else {
                let insertedCount = 0;
                for (const winner of winners) {
                    try {
                        await pool.query(
                            `INSERT INTO withdrawal_requests 
                             (user_id, wallet_address, wld_amount, particles_spent, status, admin_note, created_at)
                             VALUES ($1, $2, $3, 0, $4, $5, NOW())`,
                            [winner.id, winner.wallet_address, BONUS_AMOUNT, 'pending', 'Promo Bonus Drop - Random 20']
                        );
                        insertedCount++;
                    } catch (err) {
                        console.error(`   ❌ Failed to insert for ${winner.id}:`, err.message);
                    }
                }
                console.log(`✅ Successfully queued ${insertedCount} payouts.`);
            }
        } else {
            console.log(`\n💸 Payouts skipped (--notify-only).`);
        }

        // 4. SEND MASS NOTIFICATION
        if (!skipNotify) {
            console.log(`\n📢 Sending Mass Notification...`);

            // Re-fetch all wallets for notification (some might have invalid IDs but valid wallets in other tables, but here we just use the user list)
            const wallets = allUsers.map(u => u.wallet_address);

            // Remove duplicates just in case
            const uniqueWallets = [...new Set(wallets)];

            console.log(`   Targeting ${uniqueWallets.length} unique wallets.`);

            if (isDryRun) {
                console.log(`   [DRY RUN] Would send notification to ${uniqueWallets.length} users.`);
                console.log(`   Title: ${TITLE}`);
                console.log(`   Body: ${BODY}`);
            } else {
                await sendNotificationBatch(uniqueWallets);
            }
        } else {
            console.log(`\n📢 Notification skipped (--skip-notify).`);
        }

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
    } finally {
        await pool.end();
        console.log(`\n🏁 Done.`);
    }
}

async function sendNotificationBatch(wallets) {
    const BATCH_SIZE = 500;
    let totalSent = 0;

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
        const batch = wallets.slice(i, i + BATCH_SIZE);
        console.log(`   Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wallets.length / BATCH_SIZE)} (${batch.length} addresses)`);

        try {
            // Determine Auth Header
            let authHeader;
            if (API_KEY.includes(':') && !API_KEY.startsWith('Basic')) {
                const base64Creds = Buffer.from(API_KEY).toString('base64');
                authHeader = `Basic ${base64Creds}`;
            } else if (API_KEY.startsWith('Basic ')) {
                authHeader = API_KEY;
            } else {
                authHeader = `Bearer ${API_KEY}`;
            }

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
                totalSent += batch.length;
            } else {
                const errorText = await response.text();
                console.error(`   ❌ Batch failed:`, errorText);
            }
        } catch (error) {
            console.error(`   ❌ Network error in batch:`, error);
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`   ✅ Notification sent to ${totalSent} users.`);
}

main();
