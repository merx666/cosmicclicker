import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { nullifier_hash, transaction_ref, wallet_address, variant = 'small' } = body

        if (!nullifier_hash) {
            return NextResponse.json({ error: 'Missing nullifier_hash' }, { status: 400 })
        }

        // 1. Get user
        const userResult = await query(
            'SELECT id, vip_tier FROM users WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )

        if (userResult.rowCount === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        // Define costs and rewards based on variant
        const isBig = variant === 'big'
        const cost = isBig ? 1.5 : 0.45 // Big bet = 3x cost approx

        // Check if transaction ref already used
        const existingTx = await query(
            'SELECT id FROM roulette_spins WHERE transaction_ref = $1',
            [transaction_ref]
        )

        if (existingTx.rowCount > 0) {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 })
        }

        // 2. RNG Logic - HOUSE ALWAYS WINS (mostly)
        // Probabilities are skewed heavily towards "trash" rewards (low particles)
        // VIP chances are extremely distinct
        const roll = Math.random() * 100 // 0 to 100
        let rewardType = 'particles'
        let rewardValue = 0
        let message = ''
        let symbolResult = [0, 1, 2] // Default loser symbols

        // Odds Configuration (Percentage)
        // Small: Bronze (0.5%), Silver (0.1%), Gold (0.01%), Platinum (0%)
        // Big: Bronze (1%), Silver (0.5%), Gold (0.2%), Platinum (0.05%)

        // Symbols mapping for frontend:
        // 0: Trash (Space Debris)
        // 1: Particles (Low)
        // 2: Particles (High)
        // 3: Bronze Token
        // 4: Silver Token
        // 5: Gold Token
        // 6: Platinum Token

        if (isBig) {
            if (roll < 0.05) { // 0.05% Platinum
                rewardType = 'vip'
                rewardValue = 4
                message = 'JACKPOT! Platinum VIP!'
                symbolResult = [6, 6, 6]
            } else if (roll < 0.25) { // 0.2% Gold
                rewardType = 'vip'
                rewardValue = 3
                message = 'Amazing! Gold VIP!'
                symbolResult = [5, 5, 5]
            } else if (roll < 0.75) { // 0.5% Silver
                rewardType = 'vip'
                rewardValue = 2
                message = 'Great! Silver VIP!'
                symbolResult = [4, 4, 4]
            } else if (roll < 1.75) { // 1% Bronze
                rewardType = 'vip'
                rewardValue = 1
                message = 'Nice! Bronze VIP!'
                symbolResult = [3, 3, 3]
            } else {
                // Particles
                const particleRoll = Math.random()
                if (particleRoll < 0.3) { // 30% High Reward
                    rewardValue = Math.floor(Math.random() * (1000000 - 300000) + 300000)
                    message = `Big Win! ${rewardValue.toLocaleString()} particles!`
                    symbolResult = [2, 2, 2]
                } else { // 70% Low Reward
                    rewardValue = Math.floor(Math.random() * (300000 - 50000) + 50000)
                    message = `Won ${rewardValue.toLocaleString()} particles`
                    symbolResult = [1, 1, 1]
                }
            }
        } else {
            // SMALL Machine
            if (roll < 0.01) { // 0.01% Gold (Teaser)
                rewardType = 'vip'
                rewardValue = 3
                message = 'LUCKY! Gold VIP!'
                symbolResult = [5, 5, 5]
            } else if (roll < 0.11) { // 0.1% Silver
                rewardType = 'vip'
                rewardValue = 2
                message = 'Great! Silver VIP!'
                symbolResult = [4, 4, 4]
            } else if (roll < 0.61) { // 0.5% Bronze
                rewardType = 'vip'
                rewardValue = 1
                message = 'Nice! Bronze VIP!'
                symbolResult = [3, 3, 3]
            } else {
                // Particles
                const particleRoll = Math.random()
                if (particleRoll < 0.1) { // 10% High Reward
                    rewardValue = Math.floor(Math.random() * (200000 - 50000) + 50000)
                    message = `Nice! ${rewardValue.toLocaleString()} particles!`
                    symbolResult = [2, 2, 2]
                } else { // 90% Low Reward
                    rewardValue = Math.floor(Math.random() * (50000 - 10000) + 10000)
                    message = `Won ${rewardValue.toLocaleString()} particles`
                    symbolResult = [1, 1, 1]
                }
            }
        }

        // Force "Near Miss" spin result for visuals if it's a particle win (sometimes)
        if (rewardType === 'particles' && Math.random() > 0.5) {
            // Example: VIP, VIP, Trash
            // logic handled in frontend or we just send the winning symbols [1,1,1]
            // Actually, for a slot machine, we usually send the stopping positions.
            // But simpler: Backend returns { win: true, symbols: [X, X, X] }
            // If we want "fake near miss", we need frontend logic or explicit symbols.
            // Let's stick to returning the "Winner" symbols and let the frontend spin to them.
        }

        // 3. Apply Reward
        if (rewardType === 'vip') {
            // Only upgrade if new tier is higher
            if (rewardValue > user.vip_tier) {
                await query(
                    `UPDATE users 
                     SET vip_tier = $1, 
                         premium_vip = true,
                         premium_lucky_particle = true, -- VIP gets benefits
                         premium_daily_bonus = true
                     WHERE id = $2`,
                    [rewardValue, user.id]
                )
            } else {
                // If already has this tier or higher, give particles compensation?
                // For simplified MVP, just acknowledge the win but no downgrade.
                // Or maybe give particles as fallback?
                // Let's give a "duplicate" compensation of 200k particles
                rewardType = 'particles'
                rewardValue = 200000
                message = 'Duplicate VIP! Converted to 200,000 particles'
                await query(
                    'UPDATE users SET particles = particles + $1, total_particles_collected = total_particles_collected + $1 WHERE id = $2',
                    [rewardValue, user.id]
                )
            }
        } else {
            // Particles
            await query(
                'UPDATE users SET particles = particles + $1, total_particles_collected = total_particles_collected + $1 WHERE id = $2',
                [rewardValue, user.id]
            )
        }

        // 4. Log Spin
        await query(
            `INSERT INTO roulette_spins 
             (user_id, world_id_nullifier, wallet_address, cost_wld, reward_type, reward_value, transaction_ref)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, nullifier_hash, wallet_address || '', cost, rewardType, rewardValue, transaction_ref]
        )

        return NextResponse.json({
            success: true,
            rewardType,
            rewardValue,
            message,
            vipTier: rewardType === 'vip' ? rewardValue : user.vip_tier,
            symbols: symbolResult
        })

    } catch (error) {
        console.error('[API] Roulette error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
