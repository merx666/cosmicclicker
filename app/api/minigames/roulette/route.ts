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
            'SELECT id, vip_tier, particles, achievements FROM users WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )

        if ((userResult.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        // Define costs and rewards based on variant
        const isFree = variant === 'free' || variant === 'particles'
        const isBig = variant === 'big'
        const cost = (variant === 'free' || variant === 'particles') ? 0 : (isBig ? 1.5 : 0.45)

        // Parse achievements JSONB
        let achievements = user.achievements || {}
        if (typeof achievements === 'string') {
            try {
                achievements = JSON.parse(achievements)
            } catch (e) {
                achievements = {}
            }
        }

        let particleCost = 0
        if (variant === 'particles') {
            let spinsCount = achievements.void_wheel_spins_bought_today || 0
            const lastSpinDate = achievements.last_void_wheel_spin_date
            const todayStr = new Date().toISOString().split('T')[0]

            if (lastSpinDate !== todayStr) {
                spinsCount = 0
            }

            particleCost = 10000 * Math.pow(5, spinsCount)
            if (Number(user.particles || 0) < particleCost) {
                return NextResponse.json({ error: 'Niewystarczająca ilość cząsteczek!' }, { status: 400 })
            }

            achievements.void_wheel_spins_bought_today = spinsCount + 1
            achievements.last_void_wheel_spin_date = todayStr
        }

        // Cooldown check for free spins
        if (variant === 'free') {
            const lastSpinResult = await query(
                `SELECT created_at FROM roulette_spins 
                 WHERE user_id = $1 AND cost_wld = 0 AND transaction_ref NOT LIKE 'particle_spin_%'
                 ORDER BY created_at DESC LIMIT 1`,
                [user.id]
            )
            if ((lastSpinResult.rowCount ?? 0) > 0) {
                const lastSpinTime = new Date(lastSpinResult.rows[0].created_at).getTime()
                const cooldown = 24 * 60 * 60 * 1000 // 24 hours
                const timePassed = Date.now() - lastSpinTime
                if (timePassed < cooldown) {
                    const secondsLeft = Math.ceil((cooldown - timePassed) / 1000)
                    return NextResponse.json({ 
                        error: 'Free spin on cooldown', 
                        timeLeft: secondsLeft 
                    }, { status: 400 })
                }
            }
        }

        // Check if transaction ref already used
        const existingTx = await query(
            'SELECT id FROM roulette_spins WHERE transaction_ref = $1',
            [transaction_ref]
        )

        if ((existingTx.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 })
        }

        // Verify Telegram Stars payment if running on Telegram
        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
        if (isTelegram && variant !== 'free' && variant !== 'particles') {
            const purchase = await query(
                'SELECT id FROM purchases WHERE transaction_hash = $1 AND user_id = $2',
                [transaction_ref, user.id]
            )
            if ((purchase.rowCount ?? 0) === 0) {
                return NextResponse.json({ error: 'Płatność Stars nie została zweryfikowana.' }, { status: 400 })
            }
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

        if (isFree) {
            // FREE SPIN rewards: 10k-35k particles in 5k steps, 0.01337% chance of 0.01 WLD
            const freeRoll = Math.random() * 100
            if (freeRoll < 0.01337) {
                // ULTRA RARE: 0.01 WLD!
                rewardType = 'wld'
                rewardValue = 0.01
                message = '🎉 INCREDIBLE! You won 0.01 WLD from a FREE spin!'
                symbolResult = [5, 5, 5]
            } else {
                // Particles: 10k, 15k, 20k, 25k, 30k, 35k (weighted: lower = more likely)
                const particleTiers = [10000, 15000, 20000, 25000, 30000, 35000]
                // Weights: 35%, 25%, 18%, 12%, 7%, 3%
                const weights = [0.35, 0.25, 0.18, 0.12, 0.07, 0.03]
                const tierRoll = Math.random()
                let cumulative = 0
                let selectedTier = particleTiers[0]
                for (let i = 0; i < weights.length; i++) {
                    cumulative += weights[i]
                    if (tierRoll < cumulative) {
                        selectedTier = particleTiers[i]
                        break
                    }
                }
                rewardType = 'particles'
                rewardValue = selectedTier
                message = `Free spin: +${selectedTier.toLocaleString()} particles!`
                symbolResult = selectedTier >= 25000 ? [2, 2, 2] : [1, 1, 1]
            }
        } else if (isBig) {
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

        // 3. Apply Reward & Particle deduction
        if (rewardType === 'vip') {
            // Only upgrade if new tier is higher
            if (rewardValue > user.vip_tier) {
                await query(
                    `UPDATE users 
                     SET vip_tier = $1, 
                         premium_vip = true,
                         premium_lucky_particle = true, -- VIP gets benefits
                         premium_daily_bonus = true,
                         particles = particles - $2,
                         achievements = $3::jsonb
                     WHERE id = $4`,
                    [rewardValue, particleCost, JSON.stringify(achievements), user.id]
                )
            } else {
                // Duplicate VIP compensation: 200k particles
                rewardType = 'particles'
                rewardValue = 200000
                message = 'Duplicate VIP! Converted to 200,000 particles'
                await query(
                    `UPDATE users 
                     SET particles = particles - $1 + $2, 
                         total_particles_collected = total_particles_collected + $2,
                         achievements = $3::jsonb
                     WHERE id = $4`,
                    [particleCost, rewardValue, JSON.stringify(achievements), user.id]
                )
            }
        } else {
            // Particles
            await query(
                `UPDATE users 
                 SET particles = particles - $1 + $2, 
                     total_particles_collected = total_particles_collected + $2,
                     achievements = $3::jsonb
                 WHERE id = $4`,
                [particleCost, rewardValue, JSON.stringify(achievements), user.id]
            )
        }

        // 4. Log Spin
        await query(
            `INSERT INTO roulette_spins 
             (user_id, world_id_nullifier, wallet_address, cost_wld, reward_type, reward_value, transaction_ref)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, nullifier_hash, wallet_address || '', cost, rewardType, rewardValue, transaction_ref]
        )

        // Get updated user balance and achievements to return to the client
        const updatedUserResult = await query(
            'SELECT particles, achievements, vip_tier FROM users WHERE id = $1',
            [user.id]
        )
        const userRow = updatedUserResult.rows[0]

        return NextResponse.json({
            success: true,
            rewardType,
            rewardValue,
            message,
            vipTier: userRow.vip_tier,
            particles: Number(userRow.particles),
            achievements: userRow.achievements,
            symbols: symbolResult
        })

    } catch (error) {
        console.error('[API] Roulette error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
