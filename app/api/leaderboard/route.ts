import { NextResponse, NextRequest } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const limit = parseInt(searchParams.get('limit') || '100')

        if (!type) {
            // Default particle collectors leaderboard returned as a flat array (for clicker game)
            const result = await query(
                `SELECT 
                    id,
                    wallet_address,
                    telegram_username,
                    username,
                    total_particles_collected,
                    vip_tier
                 FROM users
                 ORDER BY total_particles_collected DESC
                 LIMIT $1`,
                [limit]
            )

            const leaderboard = result.rows.map((row: any) => {
                const name = row.telegram_username ? `@${row.telegram_username}` : (row.username || (row.wallet_address ? `${row.wallet_address.substring(0, 6)}...${row.wallet_address.substring(row.wallet_address.length - 4)}` : 'Anonymous'))
                return {
                    id: row.id,
                    name,
                    score: Number(row.total_particles_collected),
                    vip: row.vip_tier > 0
                }
            })

            return NextResponse.json(leaderboard)
        }

        let leaderboardQuery = ''

        switch (type) {
            case 'wave':
                leaderboardQuery = `
                    SELECT 
                        u.id,
                        u.wallet_address,
                        u.highest_wave,
                        u.total_games_played,
                        ROW_NUMBER() OVER (ORDER BY u.highest_wave DESC, u.total_games_played ASC) as rank
                    FROM users u
                    WHERE u.highest_wave > 0
                    ORDER BY u.highest_wave DESC, u.total_games_played ASC
                    LIMIT $1
                `
                break

            case 'spending':
                leaderboardQuery = `
                    SELECT 
                        u.id,
                        u.wallet_address,
                        u.total_spent_wld,
                        u.is_premium,
                        ROW_NUMBER() OVER (ORDER BY u.total_spent_wld DESC) as rank
                    FROM users u
                    WHERE u.total_spent_wld > 0
                    ORDER BY u.total_spent_wld DESC
                    LIMIT $1
                `
                break

            case 'streak':
                leaderboardQuery = `
                    SELECT 
                        u.id,
                        u.wallet_address,
                        s.current_streak,
                        s.highest_streak,
                        ROW_NUMBER() OVER (ORDER BY s.current_streak DESC, s.highest_streak DESC) as rank
                    FROM users u
                    JOIN user_streaks s ON u.id = s.user_id
                    WHERE s.current_streak > 0
                    ORDER BY s.current_streak DESC, s.highest_streak DESC
                    LIMIT $1
                `
                break

            case 'voidbastion':
                leaderboardQuery = `
                    SELECT 
                        u.id,
                        u.wallet_address,
                        COALESCE(gs.highest_wave, 0) as highest_wave,
                        COALESCE(gs.total_score, 0) as total_score,
                        COALESCE(gs.games_played, 0) as games_played,
                        ROW_NUMBER() OVER (ORDER BY COALESCE(gs.highest_wave, 0) DESC, COALESCE(gs.total_score, 0) DESC) as rank
                    FROM users u
                    LEFT JOIN (
                        SELECT 
                            user_id,
                            MAX(wave_reached) as highest_wave,
                            SUM(credits_earned) as total_score,
                            COUNT(*) as games_played
                        FROM game_sessions
                        GROUP BY user_id
                    ) gs ON u.id = gs.user_id
                    WHERE COALESCE(gs.highest_wave, 0) > 0
                    ORDER BY COALESCE(gs.highest_wave, 0) DESC, COALESCE(gs.total_score, 0) DESC
                    LIMIT $1
                `
                break

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        const result = await query(leaderboardQuery, [limit])

        // Format addresses (0x1234...5678) safely
        const leaderboard = result.rows.map((row: any) => {
            let displayAddress = row.wallet_address || 'unknown'
            if (displayAddress.length >= 42) {
                displayAddress = `${displayAddress.substring(0, 6)}...${displayAddress.substring(displayAddress.length - 4)}`
            }
            return {
                ...row,
                wallet_address: displayAddress,
                rank: parseInt(row.rank)
            }
        })

        return NextResponse.json({
            type,
            leaderboard,
            total: leaderboard.length
        })

    } catch (error: any) {
        console.error('Leaderboard error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
