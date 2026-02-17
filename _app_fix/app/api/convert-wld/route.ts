import { NextResponse } from 'next/server'
import { query, queryOne, transaction } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const { nullifier_hash, wld_amount } = await request.json()

        if (!nullifier_hash || !wld_amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const today = new Date().toISOString().split('T')[0]
        const MAX_DAILY_WLD = 100

        // Fetch dynamic conversion rate
        const rateConfig = await queryOne<{ value: any }>(
            `SELECT value FROM app_config WHERE key = 'conversion_rate'`
        )
        const PARTICLES_COST = rateConfig?.value?.particles_per_wld || 150000
        console.log('[Convert] Using conversion rate:', PARTICLES_COST, 'particles per 0.01 WLD')

        // SECURITY: Banned wallet addresses that exploited the system
        const BANNED_WALLETS = [
            '0xbfab37c6703e853944696dc9400be77f3878df7b', // 210 payouts
            '0x6109446d72bc62e2fda20bc04aa799cd6cff763c', // 87 payouts
            '0x947fdf4a44d0440b6d67de370193875deac10ba0', // 67 payouts
            '0x53670ca56dd6d0a0d991ff0be2b4af24643d1532'  // 23 payouts
        ]

        // Check if nullifier is banned
        if (BANNED_WALLETS.includes(nullifier_hash.toLowerCase())) {
            return NextResponse.json({
                error: 'Account suspended',
                message: 'Your account has been suspended for violating Terms of Service.'
            }, { status: 403 })
        }

        // 1. Get user and check balance + daily limits
        const user = await queryOne<{
            id: string;
            particles: number;
            world_id_nullifier: string;
            last_claim_time: string | null;
            last_withdrawal_date: string | null;
            daily_withdrawal_count: number;
            daily_withdrawal_amount: number;
        }>(
            `SELECT id, particles, world_id_nullifier, last_claim_time, 
                    last_withdrawal_date, daily_withdrawal_count, daily_withdrawal_amount 
             FROM users WHERE world_id_nullifier = $1`,
            [nullifier_hash]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 1b. SECURITY: Daily withdrawal limits per user
        if (user.last_withdrawal_date === today) {
            // Check max 1 withdrawal per day
            if (user.daily_withdrawal_count >= 1) {
                return NextResponse.json({
                    error: 'Daily limit reached',
                    message: 'You can only withdraw once per 24h. Try again tomorrow!'
                }, { status: 429 })
            }

            // Check max 0.05 WLD per day
            if (user.daily_withdrawal_amount + wld_amount > 0.05) {
                return NextResponse.json({
                    error: 'Daily limit exceeded',
                    message: `Daily limit is 0.05 WLD. You've already withdrawn ${user.daily_withdrawal_amount} WLD today.`
                }, { status: 429 })
            }
        }

        if (user.particles < PARTICLES_COST) {
            return NextResponse.json({ error: 'Insufficient particles' }, { status: 400 })
        }

        // 2a. Check Global Rolling Cooldown
        const lastLimit = await queryOne<{ limit_reached_at: string }>(
            'SELECT limit_reached_at FROM daily_conversions ORDER BY conversion_date DESC LIMIT 1'
        )
        if (lastLimit?.limit_reached_at) {
            const reachedAt = new Date(lastLimit.limit_reached_at).getTime()
            if (Date.now() - reachedAt < 24 * 60 * 60 * 1000) {
                return NextResponse.json({
                    error: 'Daily limit cooldown active',
                    message: 'Global limit reached recently. Please wait for cooldown.'
                }, { status: 429 })
            }
        }

        // 2b. Check daily limit
        const stats = await queryOne<{ total_wld_claimed: number }>(
            'SELECT total_wld_claimed FROM daily_conversions WHERE conversion_date = $1',
            [today]
        )

        const currentTotal = Number(stats?.total_wld_claimed || 0)

        if (currentTotal + wld_amount > MAX_DAILY_WLD) {
            // Mark limit reached if not already
            await query('UPDATE daily_conversions SET limit_reached_at = NOW() WHERE conversion_date = $1', [today])

            return NextResponse.json(
                {
                    error: 'Daily limit reached',
                    message: `Global daily limit of ${MAX_DAILY_WLD} WLD reached. Try again tomorrow!`,
                    currentTotal,
                    maxDaily: MAX_DAILY_WLD
                },
                { status: 429 }
            )
        }

        // 3. Process Transaction using transaction helper
        await transaction(async (client) => {
            // A. Deduct particles and update daily limits
            await client.query(
                `UPDATE users 
                 SET particles = particles - $1, 
                     last_claim_time = NOW(), 
                     last_withdrawal_date = $2,
                     daily_withdrawal_count = CASE WHEN last_withdrawal_date = $2 THEN daily_withdrawal_count + 1 ELSE 1 END,
                     daily_withdrawal_amount = CASE WHEN last_withdrawal_date = $2 THEN daily_withdrawal_amount + $3 ELSE $3 END,
                     updated_at = NOW() 
                 WHERE id = $4`,
                [PARTICLES_COST, today, wld_amount, user.id]
            )

            // B. Create Withdrawal Request
            await client.query(
                `INSERT INTO withdrawal_requests (user_id, wallet_address, wld_amount, particles_spent, status) 
                 VALUES ($1, $2, $3, $4, 'pending')`,
                [user.id, user.world_id_nullifier, wld_amount, PARTICLES_COST]
            )

            // B2. Log to withdrawal history
            await client.query(
                `INSERT INTO withdrawal_history (world_id_nullifier, particles_spent, wld_amount, conversion_rate)
                 VALUES ($1, $2, $3, $4)`,
                [user.world_id_nullifier, PARTICLES_COST, wld_amount, PARTICLES_COST]
            )

            // C. Update daily stats (upsert)
            // If this transaction causes limit to be hit, set limit_reached_at
            const newTotal = currentTotal + wld_amount
            const isLimitHit = newTotal >= MAX_DAILY_WLD

            await client.query(
                `INSERT INTO daily_conversions (conversion_date, total_wld_claimed, conversion_count, limit_reached_at) 
                 VALUES ($1, $2, 1, $3) 
                 ON CONFLICT (conversion_date) 
                 DO UPDATE SET total_wld_claimed = daily_conversions.total_wld_claimed + $2, 
                               conversion_count = daily_conversions.conversion_count + 1,
                               limit_reached_at = COALESCE(daily_conversions.limit_reached_at, $3)`,
                [today, wld_amount, isLimitHit ? new Date() : null]
            )
        })

        return NextResponse.json({
            success: true,
            status: 'pending',
            message: 'Withdrawal request added to queue',
            wld_claimed: wld_amount,
            new_total: currentTotal + wld_amount,
            remaining: MAX_DAILY_WLD - (currentTotal + wld_amount)
        })

    } catch (error) {
        console.error('[Convert WLD] Error:', error)
        return NextResponse.json(
            { error: 'Conversion processing failed' },
            { status: 500 }
        )
    }
}
