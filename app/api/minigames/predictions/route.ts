import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne, transaction } from '@/lib/db'

export const dynamic = 'force-dynamic'

const BET_COST_WLD = 0.15
const PAYOUT_MULTIPLIER = 1.9
const WINNING_PAYOUT_WLD = BET_COST_WLD * PAYOUT_MULTIPLIER // 0.285 WLD

// Fetch latest price from Tools for Humanity API
async function getWldPrice(): Promise<number | null> {
    try {
        const url = 'https://app-backend.toolsforhumanity.com/public/v1/miniapps/prices?fiatCurrencies=USD&cryptoCurrencies=WLD'
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) {
            console.error('[Predictions Price API] HTTP error:', res.status)
            return null
        }
        const data = await res.json()
        const wldUsd = data?.result?.prices?.WLD?.USD
        if (!wldUsd) return null
        
        const amount = parseFloat(wldUsd.amount)
        const decimals = parseInt(wldUsd.decimals || '12', 10)
        return amount / Math.pow(10, decimals)
    } catch (e) {
        console.error('[Predictions Price API] Fetch failed:', e)
        return null
    }
}

// Auto-resolve ended rounds
async function resolveActiveRounds() {
    try {
        // Find rounds that have passed their end_time but are not resolved yet
        const resolvingRounds = await query(
            `UPDATE predictions_rounds 
             SET status = 'resolving' 
             WHERE status IN ('open', 'locked') AND end_time <= CURRENT_TIMESTAMP 
             RETURNING *`
        )

        if (resolvingRounds.rows.length > 0) {
            const currentPrice = await getWldPrice()
            
            for (const r of resolvingRounds.rows) {
                if (currentPrice === null || !r.lock_price) {
                    // Cancel round if API failed or no lock price
                    await query(
                        `UPDATE predictions_rounds 
                         SET status = 'cancelled' 
                         WHERE id = $1`,
                        [r.id]
                    )
                    
                    // Refund all bets for cancelled round by crediting particles (drastically reduced)
                    const bets = await query('SELECT * FROM predictions_bets WHERE round_id = $1', [r.id])
                    for (const bet of bets.rows) {
                        const refundParticles = 150000 // Zredukowane z 15,000,000 particles (0.15 WLD eq)
                        await query(
                            `UPDATE users 
                             SET particles = particles + $1, 
                                 total_particles_collected = total_particles_collected + $1 
                             WHERE id = $2`,
                            [refundParticles, bet.user_id]
                        )
                        await query(
                            'UPDATE predictions_bets SET payout = $1, claimed = true WHERE id = $2',
                            [BET_COST_WLD, bet.id]
                        )
                    }
                    continue
                }

                const endPrice = currentPrice
                const lockPrice = parseFloat(r.lock_price)
                let outcome: 'up' | 'down' | 'draw' = 'draw'

                if (endPrice > lockPrice) {
                    outcome = 'up'
                } else if (endPrice < lockPrice) {
                    outcome = 'down'
                }

                // Update round outcome
                await query(
                    `UPDATE predictions_rounds 
                     SET status = 'ended', end_price = $1, outcome = $2 
                     WHERE id = $3`,
                    [endPrice, outcome, r.id]
                )

                // Process bets
                const bets = await query('SELECT * FROM predictions_bets WHERE round_id = $1', [r.id])
                for (const bet of bets.rows) {
                    let payout = 0
                    if (bet.position === outcome) {
                        if (bet.is_free_ad) {
                            // Free ad win: Reward in game particles (reduced to 5,000 particles)
                            await query('UPDATE users SET particles = particles + 5000 WHERE id = $1', [bet.user_id])
                        } else {
                            // Win! Stake + profit (1.9x)
                            payout = WINNING_PAYOUT_WLD
                        }
                    } else if (outcome === 'draw') {
                        if (!bet.is_free_ad) {
                            // Draw: Refund stake (1.0x)
                            payout = BET_COST_WLD
                        }
                    }

                    if (payout > 0 && !bet.is_free_ad) {
                        // Drastically reduced particles reward
                        // 0.285 WLD win = 250,000 particles (down from 28,500,000)
                        // 0.15 WLD refund (draw) = 150,000 particles (down from 15,000,000)
                        const rewardParticles = payout === WINNING_PAYOUT_WLD ? 250000 : 150000
                        await query(
                            `UPDATE users 
                             SET particles = particles + $1, 
                                 total_particles_collected = total_particles_collected + $1 
                             WHERE id = $2`,
                            [rewardParticles, bet.user_id]
                        )
                    }

                    await query(
                        'UPDATE predictions_bets SET payout = $1, claimed = true WHERE id = $2',
                        [payout, bet.id]
                    )
                }
            }
        }

        // Check if there is an active round currently running (open or locked)
        const activeRound = await queryOne(
            `SELECT * FROM predictions_rounds 
             WHERE status IN ('open', 'locked') AND end_time > CURRENT_TIMESTAMP 
             ORDER BY epoch DESC LIMIT 1`
        )

        if (!activeRound) {
            // Start a new round
            const lastRound = await queryOne(
                'SELECT epoch FROM predictions_rounds ORDER BY epoch DESC LIMIT 1'
            )
            const nextEpoch = lastRound ? lastRound.epoch + 1 : 1
            const currentPrice = await getWldPrice()

            if (currentPrice !== null) {
                const now = new Date()
                const lockTime = new Date(now.getTime() + 40 * 1000) // 40 seconds betting window
                const endTime = new Date(now.getTime() + 60 * 1000)  // 60 seconds total round duration

                await query(
                    `INSERT INTO predictions_rounds (epoch, start_time, lock_time, end_time, lock_price, status) 
                     VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, 'open')`,
                    [nextEpoch, lockTime, endTime, currentPrice]
                )
            }
        }
    } catch (e) {
        console.error('[Predictions API] Resolution failed:', e)
    }
}

export async function GET(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const user = await queryOne('SELECT id, particles FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (!user) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        // Run auto-resolve
        await resolveActiveRounds()

        // Check hourly bet count for this user (paid only)
        const hourlyBets = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM predictions_bets 
             WHERE user_id = $1 AND is_free_ad = FALSE AND created_at >= NOW() - INTERVAL '1 hour'`,
            [user.id]
        )
        const betsThisHour = parseInt(hourlyBets?.count || '0', 10)

        // Check daily free ad claims count for this user
        const dailyClaims = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM predictions_ad_claims 
             WHERE user_id = $1 AND clicked_at >= NOW() - INTERVAL '24 hours'`,
            [user.id]
        )
        const freeBetsToday = parseInt(dailyClaims?.count || '0', 10)

        // Get latest active/open/locked round
        const currentRound = await queryOne(
            `SELECT *, 
                EXTRACT(EPOCH FROM (lock_time - CURRENT_TIMESTAMP))::int as seconds_to_lock,
                EXTRACT(EPOCH FROM (end_time - CURRENT_TIMESTAMP))::int as seconds_to_end
             FROM predictions_rounds 
             WHERE status IN ('open', 'locked') 
             ORDER BY epoch DESC LIMIT 1`
        )

        // Get last 10 resolved rounds
        const history = await query(
            `SELECT * FROM predictions_rounds 
             WHERE status = 'ended' 
             ORDER BY epoch DESC LIMIT 10`
        )

        // Get active bets for the user in the current round
        let activeBets: any[] = []
        if (currentRound) {
            const betsRes = await query(
                `SELECT * FROM predictions_bets 
                 WHERE user_id = $1 AND round_id = $2`,
                [user.id, currentRound.id]
            )
            activeBets = betsRes.rows
        }

        // Get user's last 5 claims/payouts history
        const recentBets = await query(
            `SELECT b.*, r.epoch, r.outcome, r.lock_price, r.end_price 
             FROM predictions_bets b
             JOIN predictions_rounds r ON b.round_id = r.id
             WHERE b.user_id = $1 AND r.status = 'ended'
             ORDER BY b.created_at DESC LIMIT 5`,
            [user.id]
        )

        const currentWldPrice = await getWldPrice()

        return NextResponse.json({
            user: {
                particles: parseInt(user.particles || '0', 10),
                betsThisHour,
                freeBetsToday
            },
            currentRound: currentRound ? {
                id: currentRound.id,
                epoch: currentRound.epoch,
                lockPrice: parseFloat(currentRound.lock_price),
                status: currentRound.status,
                secondsToLock: Math.max(0, currentRound.seconds_to_lock),
                secondsToEnd: Math.max(0, currentRound.seconds_to_end)
            } : null,
            currentWldPrice,
            activeBets,
            history: history.rows.map(r => ({
                epoch: r.epoch,
                lockPrice: parseFloat(r.lock_price),
                endPrice: parseFloat(r.end_price),
                outcome: r.outcome
            })),
            recentBets: recentBets.rows.map(b => ({
                id: b.id,
                epoch: b.epoch,
                amount: parseFloat(b.amount),
                position: b.position,
                payout: parseFloat(b.payout),
                outcome: b.outcome,
                claimed: b.claimed,
                isFreeAd: b.is_free_ad
            }))
        })

    } catch (error: any) {
        console.error('[Predictions API] GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const user = await queryOne('SELECT id, wallet_address FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const body = await req.json()
        const { action, roundId, position, transactionRef, claimId, isFreeAd } = body

        // Handle initiate ad click verification
        if (action === 'initiate_ad_claim') {
            // Check daily limit (max 2 free ad predictions in 24 hours)
            const dailyClaims = await queryOne<{ count: string }>(
                `SELECT COUNT(*) FROM predictions_ad_claims 
                 WHERE user_id = $1 AND clicked_at >= NOW() - INTERVAL '24 hours'`,
                [user.id]
            )
            if (parseInt(dailyClaims?.count || '0', 10) >= 2) {
                return NextResponse.json({ error: 'Wykorzystałeś już limit 2 darmowych typowań na dobę.' }, { status: 400 })
            }

            // Create new pending claim
            const newClaim = await queryOne<{ id: number }>(
                `INSERT INTO predictions_ad_claims (user_id, status) 
                 VALUES ($1, 'pending') RETURNING id`,
                [user.id]
            )
            
            // Monetag Direct Link configured with Zone ID 11049299
            const MONETAG_DIRECT_LINK = 'https://omg10.com/4/11049498'

            return NextResponse.json({
                success: true,
                claimId: newClaim?.id,
                url: MONETAG_DIRECT_LINK
            })
        }

        if (!roundId || !position) {
            return NextResponse.json({ error: 'Missing required bet parameters' }, { status: 400 })
        }

        if (position !== 'up' && position !== 'down') {
            return NextResponse.json({ error: 'Position must be up or down' }, { status: 400 })
        }

        // Check if user already placed a bet on this round
        const existingBet = await queryOne(
            'SELECT id FROM predictions_bets WHERE user_id = $1 AND round_id = $2',
            [user.id, roundId]
        )

        if (existingBet) {
            return NextResponse.json({ error: 'Postawiłeś już prognozę w tej rundzie.' }, { status: 400 })
        }

        // Get round and check status
        const round = await queryOne(
            'SELECT * FROM predictions_rounds WHERE id = $1',
            [roundId]
        )

        if (!round) {
            return NextResponse.json({ error: 'Round not found' }, { status: 404 })
        }

        if (round.status !== 'open') {
            return NextResponse.json({ error: 'Betting is closed for this round' }, { status: 400 })
        }

        const now = new Date()
        const lockTime = new Date(round.lock_time)
        if (now.getTime() >= lockTime.getTime()) {
            await query("UPDATE predictions_rounds SET status = 'locked' WHERE id = $1", [round.id])
            return NextResponse.json({ error: 'Betting is closed (Round locked)' }, { status: 400 })
        }

        if (isFreeAd) {
            if (!claimId) {
                return NextResponse.json({ error: 'Brak identyfikatora weryfikacji reklamy.' }, { status: 400 })
            }

            // Check if claim exists and is pending
            const claim = await queryOne(
                `SELECT * FROM predictions_ad_claims WHERE id = $1 AND user_id = $2`,
                [claimId, user.id]
            )

            if (!claim) {
                return NextResponse.json({ error: 'Nieprawidłowa weryfikacja reklamy.' }, { status: 400 })
            }

            if (claim.status !== 'pending') {
                return NextResponse.json({ error: 'Ta reklama została już wykorzystana.' }, { status: 400 })
            }

            // Time verification (must wait at least 12 seconds to prevent instant bot submitting)
            const clickedTime = new Date(claim.clicked_at).getTime()
            const nowTime = Date.now()
            if (nowTime - clickedTime < 12000) {
                return NextResponse.json({ error: 'Musisz obejrzeć reklamę przez co najmniej 12 sekund.' }, { status: 400 })
            }

            // Use transaction to place bet and update claim
            await transaction(async (client) => {
                await client.query(
                    `UPDATE predictions_ad_claims SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [claimId]
                )
                await client.query(
                    `INSERT INTO predictions_bets (round_id, user_id, amount, position, transaction_ref, is_free_ad) 
                     VALUES ($1, $2, 0.0, $3, $4, TRUE)`,
                    [round.id, user.id, position, `ad_claim_${claimId}`]
                )
            })

            return NextResponse.json({
                success: true,
                message: 'Darmowa prognoza postawiona pomyślnie!'
            })
        }

        // Handle paid bet (WLD payment)
        if (!transactionRef) {
            return NextResponse.json({ error: 'Brak referencji transakcji WLD.' }, { status: 400 })
        }

        // Check hourly limit (max 2 paid bets per hour)
        const hourlyBets = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM predictions_bets 
             WHERE user_id = $1 AND is_free_ad = FALSE AND created_at >= NOW() - INTERVAL '1 hour'`,
            [user.id]
        )
        if (parseInt(hourlyBets?.count || '0', 10) >= 2) {
            return NextResponse.json({ error: 'Hourly limit reached. Max 2 predictions per hour.' }, { status: 400 })
        }

        // Check if transaction ref already used
        const existingTx = await queryOne(
            'SELECT id FROM predictions_bets WHERE transaction_ref = $1',
            [transactionRef]
        )
        if (existingTx) {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 })
        }

        // Verify Telegram Stars payment if running on Telegram
        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
        if (isTelegram) {
            const purchase = await queryOne(
                'SELECT id FROM purchases WHERE transaction_hash = $1 AND user_id = $2',
                [transactionRef, user.id]
            )
            if (!purchase) {
                return NextResponse.json({ error: 'Płatność Stars nie została zweryfikowana.' }, { status: 400 })
            }
        }

        // Insert bet with the paid WLD reference (or Stars reference on Telegram)
        await query(
            `INSERT INTO predictions_bets (round_id, user_id, amount, position, transaction_ref, is_free_ad) 
             VALUES ($1, $2, $3, $4, $5, FALSE)`,
            [round.id, user.id, BET_COST_WLD, position, transactionRef]
        )

        return NextResponse.json({
            success: true,
            message: 'Prediction placed successfully'
        })

    } catch (error: any) {
        console.error('[Predictions API] POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
