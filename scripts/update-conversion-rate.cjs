#!/usr/bin/env node

/**
 * WLD Price-Based Conversion Rate Updater
 * 
 * Adjusts the particles_per_wld threshold based on current WLD price.
 * Base formula: particles_per_wld = BASE_PARTICLES * (TARGET_PRICE / current_wld_price)
 * 
 * The BASE_PARTICLES is the minimum threshold (at target price).
 * When WLD price drops, threshold increases proportionally (harder to withdraw).
 * When WLD price rises, threshold decreases (easier to withdraw).
 * 
 * Usage:
 *   node scripts/update-conversion-rate.cjs           # Fetch price & update DB
 *   node scripts/update-conversion-rate.cjs --dry-run  # Preview only
 *   node scripts/update-conversion-rate.cjs --price 0.35  # Use manual price
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// ===================== CONFIGURATION =====================
const BASE_PARTICLES = 240000;       // Base threshold (raised 60% from 150,000)
const TARGET_PRICE = 0.50;           // Target WLD price in USD
const MIN_PARTICLES = 180000;        // Floor - never go below this
const MAX_PARTICLES = 500000;        // Ceiling - never go above this
// =========================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';
const DRY_RUN = process.argv.includes('--dry-run');

async function fetchWLDPrice() {
    // Check for manual price override
    const priceArg = process.argv.indexOf('--price');
    if (priceArg !== -1 && process.argv[priceArg + 1]) {
        const manualPrice = parseFloat(process.argv[priceArg + 1]);
        console.log(`[Rate] Using manual price: $${manualPrice}`);
        return manualPrice;
    }

    try {
        // CoinGecko free API
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd'
        );
        const data = await response.json();
        const price = data['worldcoin-wld']?.usd;

        if (!price || price <= 0) {
            throw new Error('Invalid price from CoinGecko');
        }

        console.log(`[Rate] Current WLD price from CoinGecko: $${price}`);
        return price;
    } catch (err) {
        console.error('[Rate] CoinGecko failed, trying CoinCap...');

        try {
            const response = await fetch('https://api.coincap.io/v2/assets/worldcoin');
            const data = await response.json();
            const price = parseFloat(data.data?.priceUsd);

            if (!price || price <= 0) {
                throw new Error('Invalid price from CoinCap');
            }

            console.log(`[Rate] Current WLD price from CoinCap: $${price}`);
            return price;
        } catch (err2) {
            console.error('[Rate] All price feeds failed:', err2.message);
            return null;
        }
    }
}

function calculateRate(wldPrice) {
    // Formula: when WLD price drops, threshold increases proportionally
    // particles_per_wld = BASE_PARTICLES * (TARGET_PRICE / current_price)
    let rate = Math.round(BASE_PARTICLES * (TARGET_PRICE / wldPrice));

    // Clamp between MIN and MAX
    rate = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, rate));

    return rate;
}

async function updateRate() {
    console.log('[Rate] ====================================');
    console.log('[Rate] WLD Conversion Rate Updater');
    console.log('[Rate] ====================================');
    console.log(`[Rate] Base: ${BASE_PARTICLES.toLocaleString()} particles`);
    console.log(`[Rate] Target price: $${TARGET_PRICE}`);
    console.log(`[Rate] Range: ${MIN_PARTICLES.toLocaleString()} - ${MAX_PARTICLES.toLocaleString()}`);
    console.log('[Rate] ------------------------------------');

    const wldPrice = await fetchWLDPrice();

    if (!wldPrice) {
        console.error('[Rate] ❌ Could not fetch WLD price, aborting!');
        process.exit(1);
    }

    const newRate = calculateRate(wldPrice);
    const rateChange = ((newRate - BASE_PARTICLES) / BASE_PARTICLES * 100).toFixed(1);

    console.log(`[Rate] Calculated rate: ${newRate.toLocaleString()} particles per 0.01 WLD`);
    console.log(`[Rate] Change from base: ${rateChange}%`);
    console.log(`[Rate] At $${wldPrice}: ${newRate.toLocaleString()} particles = 0.01 WLD ($${(0.01 * wldPrice).toFixed(4)})`);

    if (DRY_RUN) {
        console.log('[Rate] 🔍 DRY RUN - No changes made');
        return;
    }

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: false
    });

    try {
        const rateValue = {
            particles_per_wld: newRate,
            wld_price_usd: wldPrice,
            last_update: new Date().toISOString(),
            base_rate: BASE_PARTICLES,
            target_price: TARGET_PRICE
        };

        await pool.query(
            `INSERT INTO app_config (key, value) 
             VALUES ('conversion_rate', $1::jsonb) 
             ON CONFLICT (key) 
             DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
            [JSON.stringify(rateValue)]
        );

        console.log(`[Rate] ✅ Updated conversion rate in DB:`);
        console.log(`[Rate]    particles_per_wld: ${newRate.toLocaleString()}`);
        console.log(`[Rate]    wld_price_usd: $${wldPrice}`);
        console.log(`[Rate]    timestamp: ${rateValue.last_update}`);

    } catch (err) {
        console.error('[Rate] ❌ DB Error:', err.message);
    } finally {
        await pool.end();
    }
}

updateRate();
