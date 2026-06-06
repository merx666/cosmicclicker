import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const nullifierHash = searchParams.get('nullifier_hash')

        // 1. Ensure DB tables exist (automatic migration)
        await execute(`
            CREATE TABLE IF NOT EXISTS void_block_rounds (
                id SERIAL PRIMARY KEY,
                status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'resolving', 'finished'
                total_pool DECIMAL(18, 4) DEFAULT 0.0000,
                fee_amount DECIMAL(18, 4) DEFAULT 0.0000,
                net_pool DECIMAL(18, 4) DEFAULT 0.0000,
                winner_wallet TEXT,
                winner_nullifier TEXT,
                winner_username TEXT,
                start_time TIMESTAMP DEFAULT NOW(),
                end_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)

        await execute(`
            CREATE TABLE IF NOT EXISTS void_block_bets (
                id SERIAL PRIMARY KEY,
                round_id INTEGER REFERENCES void_block_rounds(id) ON DELETE CASCADE,
                nullifier_hash TEXT NOT NULL,
                username TEXT,
                wallet_address TEXT NOT NULL,
                bet_amount DECIMAL(18, 4) NOT NULL,
                transaction_ref TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)

        // 2. Fetch current active round
        let activeRoundResult = await query(
            "SELECT * FROM void_block_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        )

        let activeRound = activeRoundResult.rows[0]

        // 3. If no active round exists, initialize the first one!
        if (!activeRound) {
            const durationSeconds = 60
            const endTime = new Date(Date.now() + durationSeconds * 1000)
            
            const insertResult = await query(
                `INSERT INTO void_block_rounds (status, total_pool, fee_amount, net_pool, end_time) 
                 VALUES ('active', 0.0000, 0.0000, 0.0000, $1) RETURNING *`,
                [endTime]
            )
            activeRound = insertResult.rows[0]
        }

        // 4. Fetch bets for this round
        const betsResult = await query(
            "SELECT id, nullifier_hash, username, wallet_address, bet_amount, created_at FROM void_block_bets WHERE round_id = $1 ORDER BY created_at DESC",
            [activeRound.id]
        )
        const bets = betsResult.rows

        // Calculate stats for user's active participation
        let userTotalBet = 0
        if (nullifierHash) {
            userTotalBet = bets
                .filter(b => b.nullifier_hash === nullifierHash)
                .reduce((sum, b) => sum + parseFloat(b.bet_amount), 0)
        }

        // 5. Fetch last 5 winners (history)
        const historyResult = await query(
            `SELECT id, winner_wallet, winner_username, total_pool, net_pool, resolved_at 
             FROM (
                SELECT id, winner_wallet, winner_username, total_pool, net_pool, end_time as resolved_at 
                FROM void_block_rounds 
                WHERE status = 'finished'
             ) h 
             ORDER BY id DESC LIMIT 5`
        )
        const history = historyResult.rows

        return NextResponse.json({
            round: {
                id: activeRound.id,
                status: activeRound.status,
                total_pool: parseFloat(activeRound.total_pool || '0'),
                fee_amount: parseFloat(activeRound.fee_amount || '0'),
                net_pool: parseFloat(activeRound.net_pool || '0'),
                end_time: new Date(activeRound.end_time).getTime(),
                start_time: new Date(activeRound.start_time).getTime(),
            },
            bets: bets.map(b => ({
                id: b.id,
                username: b.username || 'Anonymous',
                wallet_address: b.wallet_address,
                bet_amount: parseFloat(b.bet_amount),
                chance: parseFloat(activeRound.total_pool) > 0 
                    ? parseFloat(((parseFloat(b.bet_amount) / parseFloat(activeRound.total_pool)) * 100).toFixed(2)) 
                    : 0,
                nullifier_hash: b.nullifier_hash,
            })),
            user: {
                total_bet: userTotalBet,
                chance: parseFloat(activeRound.total_pool) > 0 
                    ? parseFloat(((userTotalBet / parseFloat(activeRound.total_pool)) * 100).toFixed(2)) 
                    : 0
            },
            history: history.map(h => ({
                id: h.id,
                winner_wallet: h.winner_wallet,
                winner_username: h.winner_username || 'Anonymous',
                total_pool: parseFloat(h.total_pool || '0'),
                net_pool: parseFloat(h.net_pool || '0'),
                resolved_at: new Date(h.resolved_at).getTime()
            }))
        })

    } catch (error) {
        console.error('Void Block state error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
