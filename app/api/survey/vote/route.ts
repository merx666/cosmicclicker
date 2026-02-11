import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { nullifier_hash, poll_id, vote, transaction_ref, vote_cost } = body

        if (!nullifier_hash || !poll_id || !vote || !transaction_ref) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (vote !== 'yes' && vote !== 'no') {
            return NextResponse.json({ error: 'Vote must be yes or no' }, { status: 400 })
        }

        // Check transaction not already used
        const existingTx = await query(
            'SELECT id FROM survey_votes WHERE transaction_ref = $1',
            [transaction_ref]
        )
        if ((existingTx.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 })
        }

        // Check user vote count
        const userVoteResult = await query(
            'SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = $1 AND nullifier_hash = $2',
            [poll_id, nullifier_hash]
        )
        const currentVotes = parseInt(userVoteResult.rows[0]?.count || '0')

        if (currentVotes >= 10) {
            return NextResponse.json({ error: 'Maximum votes reached' }, { status: 400 })
        }

        // Get user ID
        const userResult = await query(
            'SELECT id FROM users WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )
        const userId = userResult.rows[0]?.id || null

        // Record vote
        await query(
            `INSERT INTO survey_votes (poll_id, user_id, nullifier_hash, vote, vote_number, vote_cost, transaction_ref)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [poll_id, userId, nullifier_hash, vote, currentVotes + 1, vote_cost || 0, transaction_ref]
        )

        // Get updated counts
        const yesResult = await query(
            "SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = $1 AND vote = 'yes'",
            [poll_id]
        )
        const noResult = await query(
            "SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = $1 AND vote = 'no'",
            [poll_id]
        )

        return NextResponse.json({
            success: true,
            yesCount: parseInt(yesResult.rows[0]?.count || '0'),
            noCount: parseInt(noResult.rows[0]?.count || '0'),
        })

    } catch (error) {
        console.error('Vote error:', error)
        return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
    }
}
