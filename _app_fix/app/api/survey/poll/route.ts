import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const nullifierHash = searchParams.get('nullifier_hash')

        // Ensure survey table exists
        await query(`
            CREATE TABLE IF NOT EXISTS survey_votes (
                id SERIAL PRIMARY KEY,
                poll_id VARCHAR(50) NOT NULL,
                user_id UUID,
                nullifier_hash TEXT NOT NULL,
                vote VARCHAR(10) NOT NULL,
                vote_number INTEGER NOT NULL DEFAULT 1,
                vote_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
                transaction_ref TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)

        // Get current poll results
        const yesResult = await query(
            "SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = 'poll_001' AND vote = 'yes'"
        )
        const noResult = await query(
            "SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = 'poll_001' AND vote = 'no'"
        )

        let userVotes = 0
        if (nullifierHash) {
            const userVoteResult = await query(
                "SELECT COUNT(*) as count FROM survey_votes WHERE poll_id = 'poll_001' AND nullifier_hash = $1",
                [nullifierHash]
            )
            userVotes = parseInt(userVoteResult.rows[0]?.count || '0')
        }

        return NextResponse.json({
            poll: {
                id: 'poll_001',
                question: 'Should we make the game 75% harder?',
                yesCount: parseInt(yesResult.rows[0]?.count || '0'),
                noCount: parseInt(noResult.rows[0]?.count || '0'),
                userVotes,
            }
        })

    } catch (error) {
        console.error('Poll fetch error:', error)
        return NextResponse.json({
            poll: {
                id: 'poll_001',
                question: 'Should we make the game 75% harder?',
                yesCount: 0,
                noCount: 0,
                userVotes: 0,
            }
        })
    }
}
