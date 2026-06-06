import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

interface GameSessionData {
    waveReached: number
    creditsEarned: number
    enemiesKilled: number
    durationSeconds: number
    difficulty: string
}

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const sessionData: GameSessionData = await req.json()

        // Get user
        const userResult = await query(
            'SELECT id, highest_wave FROM users WHERE wallet_address = $1',
            [address.toLowerCase()]
        )

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        // Record game session
        await query(
            `INSERT INTO game_sessions 
             (user_id, wave_reached, credits_earned, enemies_killed, duration_seconds, difficulty_level)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                user.id,
                sessionData.waveReached,
                sessionData.creditsEarned,
                sessionData.enemiesKilled,
                sessionData.durationSeconds,
                sessionData.difficulty
            ]
        )

        // Update user stats
        const newHighestWave = Math.max(user.highest_wave || 0, sessionData.waveReached)

        await query(
            `UPDATE users 
             SET total_games_played = total_games_played + 1,
                 highest_wave = $1,
                 total_credits_earned = total_credits_earned + $2,
                 total_enemies_killed = total_enemies_killed + $3,
                 playtime_seconds = playtime_seconds + $4
             WHERE id = $5`,
            [
                newHighestWave,
                sessionData.creditsEarned,
                sessionData.enemiesKilled,
                sessionData.durationSeconds,
                user.id
            ]
        )

        // Check wave achievements
        const achievements = []

        if (sessionData.waveReached >= 10) {
            const result = await query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, 'wave_10')
                 ON CONFLICT DO NOTHING
                 RETURNING achievement_id`,
                [user.id]
            )
            if (result.rows.length > 0) achievements.push('wave_10')
        }

        if (sessionData.waveReached >= 50) {
            const result = await query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, 'wave_50')
                 ON CONFLICT DO NOTHING
                 RETURNING achievement_id`,
                [user.id]
            )
            if (result.rows.length > 0) achievements.push('wave_50')
        }

        if (sessionData.waveReached >= 100) {
            const result = await query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, 'wave_100')
                 ON CONFLICT DO NOTHING
                 RETURNING achievement_id`,
                [user.id]
            )
            if (result.rows.length > 0) achievements.push('wave_100')
        }

        // Check kill achievements
        const totalKillsResult = await query(
            'SELECT total_enemies_killed FROM users WHERE id = $1',
            [user.id]
        )
        const totalKills = totalKillsResult.rows[0].total_enemies_killed || 0

        if (totalKills >= 1000) {
            const result = await query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, 'kills_1000')
                 ON CONFLICT DO NOTHING
                 RETURNING achievement_id`,
                [user.id]
            )
            if (result.rows.length > 0) achievements.push('kills_1000')
        }

        if (totalKills >= 10000) {
            const result = await query(
                `INSERT INTO user_achievements (user_id, achievement_id)
                 VALUES ($1, 'kills_10000')
                 ON CONFLICT DO NOTHING
                 RETURNING achievement_id`,
                [user.id]
            )
            if (result.rows.length > 0) achievements.push('kills_10000')
        }

        return NextResponse.json({
            success: true,
            newHighestWave,
            achievementsUnlocked: achievements
        })

    } catch (error: any) {
        console.error('Session save error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
