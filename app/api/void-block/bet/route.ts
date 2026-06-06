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

            // 3. Update round pool & fee calculations
            const updatedRoundRes = await client.query(
                `UPDATE void_block_rounds 
                 SET total_pool = total_pool + $1,
                     fee_amount = (total_pool + $1) * 0.13,
                     net_pool = (total_pool + $1) * 0.87
                 WHERE id = $2 RETURNING *`,
                [betVal, round_id]
            )

            return updatedRoundRes.rows[0]
        })

        return NextResponse.json({
            success: true,
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
