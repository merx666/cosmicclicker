#!/usr/bin/env node

import pkg from 'pg'
const { Pool } = pkg

async function updateConversionRate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL ||
            'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector',
        ssl: false
    })

    try {
        console.log('[Conversion] Starting rate update...')

        // 1. Fetch current WLD price from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd')
        const data = await response.json()
        const wldPriceUSD = data['worldcoin-wld'].usd

        console.log(`[Conversion] Current WLD price: $${wldPriceUSD}`)

        // 2. Calculate dynamic rate
        // Formula: particles_per_0.01_WLD = BASE_RATE * (WLD_PRICE_USD / TARGET_PRICE)
        const BASE_RATE = 250000
        const TARGET_PRICE = 0.50
        const particlesPerWLD = Math.floor(BASE_RATE * (wldPriceUSD / TARGET_PRICE))

        console.log(`[Conversion] New rate: ${particlesPerWLD.toLocaleString()} particles per 0.01 WLD`)
        console.log(`[Conversion] Formula: ${BASE_RATE} * (${wldPriceUSD} / ${TARGET_PRICE}) = ${particlesPerWLD}`)

        // 3. Update in database
        await pool.query(
            `INSERT INTO app_config (key, value, updated_at) 
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) 
             DO UPDATE SET value = $2, updated_at = NOW()`,
            [
                'conversion_rate',
                JSON.stringify({
                    particles_per_wld: particlesPerWLD,
                    wld_price_usd: wldPriceUSD,
                    last_update: new Date().toISOString(),
                    base_rate: BASE_RATE,
                    target_price: TARGET_PRICE
                })
            ]
        )

        console.log(`[Conversion] ✅ Rate updated successfully at ${new Date().toISOString()}`)
    } catch (error) {
        console.error('[Conversion] ❌ Error:', error)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

updateConversionRate()
