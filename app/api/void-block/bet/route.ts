import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { nullifier_hash, username, wallet_address, bet_amount, transaction_ref, round_id } = body

        // Validate required inputs
        if (!nullifier_hash || !wallet_address || !bet_amount || !transaction_ref || !round_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const betVal = parseFloat(bet_amount)
        if (isNaN(betVal) || betVal <= 0) {
            return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 })
        }

        let referralAwarded = false

        // Run as a database transaction
        const result = await transaction(async (client) => {
            // 1. Check if round is active
            const roundRes = await client.query(
                "SELECT id, status FROM void_block_rounds WHERE id = $1 FOR UPDATE",
                [round_id]
            )
            const round = roundRes.rows[0]

            if (!round) {
                throw new Error('Round not found')
            }
            if (round.status !== 'active') {
                throw new Error('Round is no longer active')
            }

            // 2. Insert bet
            await client.query(
                `INSERT INTO void_block_bets (round_id, nullifier_hash, username, wallet_address, bet_amount, transaction_ref) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [round_id, nullifier_hash, username || null, wallet_address, betVal, transaction_ref]
            )

            // Get total count of bets for this round now
            const countRes = await client.query(
                "SELECT COUNT(*)::int as count FROM void_block_bets WHERE round_id = $1",
                [round_id]
            )
            const betsCount = countRes.rows[0]?.count || 0

            // 3. Referral processing
            const userRes = await client.query(
                "SELECT referred_by, referral_reward_claimed FROM users WHERE world_id_nullifier = $1 FOR UPDATE",
                [nullifier_hash]
            )
            const user = userRes.rows[0]

            if (user && user.referred_by && !user.referral_reward_claimed) {
                // Award 100k to referrer
                await client.query(
                    `UPDATE users 
                     SET particles = particles + 100000, 
                         total_particles_collected = total_particles_collected + 100000,
                         updated_at = NOW() 
                     WHERE world_id_nullifier = $1`,
                    [user.referred_by]
                )
                // Award 50k to referee (current user)
                await client.query(
                    `UPDATE users 
                     SET particles = particles + 50000, 
                         total_particles_collected = total_particles_collected + 50000,
                         referral_reward_claimed = TRUE,
                         updated_at = NOW() 
                     WHERE world_id_nullifier = $1`,
                    [nullifier_hash]
                )
                referralAwarded = true
            }

            // 4. Update round pool & fee calculations
            // If we just reached exactly 3 bets, set end_time to 5 minutes from now!
            let updatedRoundRes
            if (betsCount === 3) {
                const newEndTime = new Date(Date.now() + 300 * 1000)
                updatedRoundRes = await client.query(
                    `UPDATE void_block_rounds 
                     SET total_pool = total_pool + $1,
                         fee_amount = (total_pool + $1) * 0.13,
                         net_pool = (total_pool + $1) * 0.87,
                         end_time = $2
                     WHERE id = $3 RETURNING *`,
                    [betVal, newEndTime, round_id]
                )
            } else {
                updatedRoundRes = await client.query(
                    `UPDATE void_block_rounds 
                     SET total_pool = total_pool + $1,
                         fee_amount = (total_pool + $1) * 0.13,
                         net_pool = (total_pool + $1) * 0.87
                     WHERE id = $2 RETURNING *`,
                    [betVal, round_id]
                )
            }

            return updatedRoundRes.rows[0]
        })

        return NextResponse.json({
            success: true,
            referral_awarded: referralAwarded,
            round: {
                id: result.id,
                total_pool: parseFloat(result.total_pool),
                fee_amount: parseFloat(result.fee_amount),
                net_pool: parseFloat(result.net_pool),
            }
        })

    } catch (error: any) {
        console.error('Void Block bet placement error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to place bet' }, { status: 500 })
    }
}
