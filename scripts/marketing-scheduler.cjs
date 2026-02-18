#!/usr/bin/env node

/**
 * Marketing Scheduler — Automated notification campaigns with delay management
 * 
 * Usage:
 *   node scripts/marketing-scheduler.cjs --campaign blitz     # Run 3-wave blitz
 *   node scripts/marketing-scheduler.cjs --campaign daily     # Run daily engagement
 *   node scripts/marketing-scheduler.cjs --campaign comeback  # Run comeback campaign
 *   node scripts/marketing-scheduler.cjs --list               # List templates
 *   node scripts/marketing-scheduler.cjs --campaign blitz --dry-run
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ─── Campaign Templates ─────────────────────────────────
const TEMPLATES = {
    blitz: {
        name: 'Aggressive Marketing Blitz',
        description: '3-wave crescendo: urgency → FOMO → competition',
        waves: [
            { title: '🔥 Double Rewards Event!', message: 'Earn 2X particles for the next 24h! Don\'t miss out! ⚡', delayMinutes: 0 },
            { title: '💰 Your Particles Are Waiting!', message: 'Thousands already claimed today. Your uncollected particles expire soon! 🕐', delayMinutes: 360 },
            { title: '🏆 Weekend Contest LIVE!', message: 'Top 100 clickers get bonus WLD rewards! Check your ranking! 🎯', delayMinutes: 1080 }
        ]
    },
    daily: {
        name: 'Daily Engagement',
        description: 'Single-wave daily reminder',
        waves: [
            { title: '⚡ Daily Bonus Ready!', message: 'Your free daily spin + particle bonus is waiting. Don\'t lose your streak! 🔥', delayMinutes: 0 }
        ]
    },
    comeback: {
        name: 'Comeback Campaign',
        description: '2-wave re-engagement for dormant users',
        waves: [
            { title: '🕳️ We Miss You!', message: 'Your Void Collector account has unclaimed rewards. Come back and collect before they expire! 💎', delayMinutes: 0 },
            { title: '🎁 Welcome Back Bonus!', message: 'Log in now to receive a special comeback bonus — 500 FREE particles waiting for you! 🚀', delayMinutes: 720 }
        ]
    },
    payout: {
        name: 'Payout Announcement',
        description: 'Announce payouts are live/fixed',
        waves: [
            { title: '✅ Payouts Are LIVE!', message: 'All pending WLD withdrawals are being processed now! Check your wallet! 💰', delayMinutes: 0 }
        ]
    },
    event: {
        name: 'Special Event',
        description: '2-wave event hype + reminder',
        waves: [
            { title: '🎰 MEGA EVENT STARTS NOW!', message: 'Limited time: 3X rewards on ALL activities! Slot machine jackpot increased to 5000 WLD! 🎯', delayMinutes: 0 },
            { title: '⏰ Event Ending Soon!', message: 'Only 6 hours left in the MEGA EVENT! Don\'t miss your chance at 3X rewards! ⚡', delayMinutes: 1080 }
        ]
    }
};

// ─── Config ─────────────────────────────────────────────
const API_KEY = process.env.WORLDCOIN_API_KEY;
const APP_ID = process.env.WORLDCOIN_APP_ID || process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_e3c317455f168a14ab972dbe4f34ab9a';
const DATABASE_URL = process.env.DATABASE_URL;
const LOG_DIR = process.env.MARKETING_LOG_DIR || '/var/log';
const LOG_FILE = path.join(LOG_DIR, 'void-marketing.log');

if (!API_KEY) { console.error('[Scheduler] ERROR: WORLDCOIN_API_KEY required'); process.exit(1); }
if (!DATABASE_URL) { console.error('[Scheduler] ERROR: DATABASE_URL required'); process.exit(1); }

// ─── CLI ────────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = { campaign: null, dryRun: false, list: false };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--campaign':
            case '-c':
                parsed.campaign = args[++i]; break;
            case '--dry-run':
            case '-d':
                parsed.dryRun = true; break;
            case '--list':
            case '-l':
                parsed.list = true; break;
            case '--help':
            case '-h':
                console.log(`
Usage: node marketing-scheduler.cjs [options]

Options:
  --campaign, -c <name>   Campaign template: ${Object.keys(TEMPLATES).join(', ')}
  --dry-run, -d           Preview without sending
  --list, -l              List all templates
  --help, -h              Show help
                `);
                process.exit(0);
        }
    }
    return parsed;
}

// ─── Logger ─────────────────────────────────────────────
function log(msg) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
    try {
        fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (e) {
        // Log dir might not exist locally — ok
    }
}

// ─── Send batch ─────────────────────────────────────────
async function sendBatch(wallets, title, message, dryRun) {
    const BATCH_SIZE = 1000;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
        const batch = wallets.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(wallets.length / BATCH_SIZE);

        log(`  Batch ${batchNum}/${totalBatches} (${batch.length} addresses)`);

        if (dryRun) {
            totalSent += batch.length;
            continue;
        }

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
                    title,
                    message,
                    mini_app_path: `worldapp://mini-app?app_id=${APP_ID}`
                })
            });

            const data = await response.json();
            if (response.ok) {
                log(`  ✅ Batch ${batchNum}: ${JSON.stringify(data)}`);
                totalSent += batch.length;
            } else {
                log(`  ❌ Batch ${batchNum} fail: ${JSON.stringify(data)}`);
                totalFailed += batch.length;
            }
        } catch (err) {
            log(`  ❌ Batch ${batchNum} error: ${err.message}`);
            totalFailed += batch.length;
        }

        if (i + BATCH_SIZE < wallets.length) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    return { sent: totalSent, failed: totalFailed };
}

// ─── Main ───────────────────────────────────────────────
async function main() {
    const { campaign, dryRun, list } = parseArgs();

    if (list) {
        console.log('\n[Scheduler] Available Campaign Templates:\n');
        Object.entries(TEMPLATES).forEach(([key, t]) => {
            console.log(`  📋 ${key} — ${t.name}`);
            console.log(`     ${t.description}`);
            console.log(`     Waves: ${t.waves.length}`);
            t.waves.forEach((w, i) => {
                console.log(`       ${i + 1}. "${w.title}" (delay: ${w.delayMinutes}min)`);
            });
            console.log('');
        });
        return;
    }

    if (!campaign) {
        console.error(`[Scheduler] ERROR: --campaign required. Options: ${Object.keys(TEMPLATES).join(', ')}`);
        process.exit(1);
    }

    const template = TEMPLATES[campaign];
    if (!template) {
        console.error(`[Scheduler] ERROR: Unknown campaign "${campaign}". Options: ${Object.keys(TEMPLATES).join(', ')}`);
        process.exit(1);
    }

    log(`═══════════════════════════════════════════`);
    log(`Campaign: ${template.name} (${campaign})`);
    log(`Mode: ${dryRun ? '🔍 DRY-RUN' : '🚀 LIVE'}`);
    log(`Waves: ${template.waves.length}`);
    log(`═══════════════════════════════════════════`);

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        const result = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address IS NOT NULL'
        );
        const wallets = result.rows
            .map(r => r.wallet_address)
            .filter(w => w && w.length === 42 && w.startsWith('0x'));

        log(`Targets: ${wallets.length} valid wallets`);

        const summary = [];

        for (let i = 0; i < template.waves.length; i++) {
            const wave = template.waves[i];

            if (wave.delayMinutes > 0 && !dryRun) {
                const delayMs = wave.delayMinutes * 60 * 1000;
                const nextTime = new Date(Date.now() + delayMs).toISOString();
                log(`\n⏳ Waiting ${wave.delayMinutes} min before wave ${i + 1}... (next at ${nextTime})`);
                await new Promise(r => setTimeout(r, delayMs));
            }

            log(`\n── Wave ${i + 1}/${template.waves.length} ──────────────────`);
            log(`Title:   "${wave.title}"`);
            log(`Message: "${wave.message}"`);

            const res = await sendBatch(wallets, wave.title, wave.message, dryRun);
            summary.push({ wave: i + 1, title: wave.title, ...res });
        }

        log(`\n═══════════ CAMPAIGN REPORT ═══════════`);
        log(`Campaign: ${template.name}`);
        summary.forEach(s => {
            log(`  Wave ${s.wave}: ✅ ${s.sent} sent, ❌ ${s.failed} failed — "${s.title}"`);
        });
        const totalSent = summary.reduce((a, s) => a + s.sent, 0);
        const totalFailed = summary.reduce((a, s) => a + s.failed, 0);
        log(`Total: ✅ ${totalSent} sent, ❌ ${totalFailed} failed`);
        log(`════════════════════════════════════════`);

    } catch (error) {
        log(`FATAL: ${error.message}`);
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();
