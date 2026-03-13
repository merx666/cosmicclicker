const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/void-collector/.env.production' });

const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

const TITLE = '⚡ SEASON 2 DROPS MARCH 9TH!';
const BODY = 'The wait is almost over! Season 2 of Cosmic Clicker launches on March 9th with fresh rewards, new challenges, and bigger prizes. Get ready to dominate the leaderboard! 🏆🚀';

async function sendNotificationBatch(wallets) {
    const BATCH_SIZE = 500;
    let totalSent = 0;

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
        const batch = wallets.slice(i, i + BATCH_SIZE);
        console.log(`   Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wallets.length / BATCH_SIZE)} (${batch.length} addresses)`);

        try {
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
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            if (response.ok) {
                const data = await response.json();
                totalSent += batch.length;
                console.log(`   ✅ Batch sent successfully.`, JSON.stringify(data));
            } else {
                const errorText = await response.text();
                console.error(`   ❌ Batch failed:`, errorText);
            }
        } catch (error) {
            console.error(`   ❌ Network error in batch:`, error);
        }

        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`\n   ✅ Total notifications sent to ${totalSent} users.`);
}

async function main() {
    console.log('\n⚡ SEASON 2 REMINDER - MASS NOTIFICATION');
    console.log('--------------------------------------------------');
    console.log(`Title: ${TITLE}`);
    console.log(`Body: ${BODY}`);
    console.log('--------------------------------------------------');

    if (!API_KEY) {
        console.error('❌ ERROR: WORLDCOIN_API_KEY not found');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: false
    });

    try {
        const res = await pool.query(
            `SELECT DISTINCT wallet_address FROM users 
             WHERE wallet_address IS NOT NULL 
             AND LENGTH(wallet_address) = 42 
             AND wallet_address LIKE '0x%'`
        );

        const wallets = res.rows.map(r => r.wallet_address);
        console.log(`\n📊 Found ${wallets.length} unique wallets to notify.`);

        await sendNotificationBatch(wallets);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
    } finally {
        await pool.end();
        console.log('\n🏁 Done.');
    }
}

main();
