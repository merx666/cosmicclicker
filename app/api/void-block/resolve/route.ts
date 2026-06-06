import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { transferJackpotWLD } from '@/lib/payout'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authorization
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VoidCollectorDB2024!' // fallback for safety

        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null
        if (!token || token !== ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const force = !!body.force

        // 2. Fetch the active round
        const activeRoundRes = await query(
            "SELECT * FROM void_block_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        )
        const round = activeRoundRes.rows[0]

        if (!round) {
            return NextResponse.json({ error: 'No active round found' }, { status: 400 })
        }

        // Check if round is expired
        const now = new Date()
        const endTime = new Date(round.end_time)
        const isExpired = now >= endTime

        if (!isExpired && !force) {
            return NextResponse.json({ 
                success: false, 
                message: 'Round is still running', 
                time_remaining: endTime.getTime() - now.getTime() 
            })
        }

        const totalPool = parseFloat(round.total_pool || '0')

        // 3. Case A: Pula jest zerowa (nikt nie postawił)
        // Przedłużamy rundę o kolejne 60 sekund
        if (totalPool === 0) {
            const nextEndTime = new Date(Date.now() + 60 * 1000)
            await query(
                "UPDATE void_block_rounds SET end_time = $1 WHERE id = $2",
                [nextEndTime, round.id]
            )
            return NextResponse.json({
                success: true,
                message: 'Round extended (empty pool)',
                round: {
                    id: round.id,
                    end_time: nextEndTime.getTime()
                }
            })
        }

        // 4. Case B: Pula > 0. Losowanie zwycięzcy
        // Pobieramy wszystkie zakłady z danej rundy
        const betsRes = await query(
            "SELECT nullifier_hash, username, wallet_address, bet_amount FROM void_block_bets WHERE round_id = $1",
            [round.id]
        )
        const bets = betsRes.rows

        if (bets.length === 0) {
            // Failsafe: if totalPool > 0 but no bets (should not happen due to DB constraint/integrity)
            const nextEndTime = new Date(Date.now() + 60 * 1000)
            await query(
                "UPDATE void_block_rounds SET end_time = $1, total_pool = 0, fee_amount = 0, net_pool = 0 WHERE id = $2",
                [nextEndTime, round.id]
            )
            return NextResponse.json({ success: false, error: 'Inconsistent state: pool > 0 but no bets. Extended.' })
        }

        // Losowanie zwycięzcy (Weighted Random)
        const totalBetSum = bets.reduce((sum, b) => sum + parseFloat(b.bet_amount), 0)
        let randomPoint = Math.random() * totalBetSum
        
        let winner = bets[0]
        for (const bet of bets) {
            randomPoint -= parseFloat(bet.bet_amount)
            if (randomPoint <= 0) {
                winner = bet
                break;
            }
        }

        const netPayoutAmount = parseFloat(round.net_pool)

        // 5. Transfer WLD to the winner
        console.log(`[Void Block] Resolving round ${round.id}. Winner: ${winner.wallet_address}, Payout: ${netPayoutAmount} WLD`)
        const payoutResult = await transferJackpotWLD(winner.wallet_address, netPayoutAmount)

        if (!payoutResult.success) {
            // W przypadku błędu transferu (np. brak środków na hotwallecie)
            // Zatrzymujemy transakcję i raportujemy administratorowi
            console.error('[Void Block] Jackpot payout failed:', payoutResult.error)
            return NextResponse.json({ 
                success: false, 
                error: 'Payout transfer failed', 
                details: payoutResult.error,
                winner_wallet: winner.wallet_address,
                payout_amount: netPayoutAmount
            }, { status: 500 })
        }

        // 6. DB Transaction to close current round and open a new one
        const nextEndTime = new Date(Date.now() + 60 * 1000)

        const resolution = await transaction(async (client) => {
            // Close active round
            const closedRoundRes = await client.query(
                `UPDATE void_block_rounds 
                 SET status = 'finished',
                     winner_wallet = $1,
                     winner_nullifier = $2,
                     winner_username = $3
                 WHERE id = $4 RETURNING *`,
                [winner.wallet_address, winner.nullifier_hash, winner.username || 'Anonymous', round.id]
            )

            // Open next round
            const newRoundRes = await client.query(
                `INSERT INTO void_block_rounds (status, total_pool, fee_amount, net_pool, end_time) 
                 VALUES ('active', 0.0000, 0.0000, 0.0000, $1) RETURNING *`,
                [nextEndTime]
            )

            return {
                resolvedRound: closedRoundRes.rows[0],
                newRound: newRoundRes.rows[0]
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Round resolved successfully',
            resolved_round: {
                id: round.id,
                winner: winner.wallet_address,
                winner_username: winner.username || 'Anonymous',
                total_pool: totalPool,
                net_pool: netPayoutAmount,
                payout_tx_hash: payoutResult.hash
            },
            new_round: {
                id: resolution.newRound.id,
                end_time: nextEndTime.getTime()
            }
        })

    } catch (error) {
        console.error('Void Block resolution error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
