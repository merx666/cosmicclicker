import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { STREAK_REWARDS } from '@/lib/gameEconomy'

// Helper to get today string UTC
const getTodayUTC = () => new Date().toISOString().split('T')[0]

// Helper to normalize date from DB
const normalizeDate = (date: Date | string | null) => {
    if (!date) return null
    if (typeof date === 'string') return date.split('T')[0]
    if (date instanceof Date) {
        // Fix timezone / midnight offset by adding 12h
        const adjusted = new Date(date.getTime() + 12 * 60 * 60 * 1000)
        return adjusted.toISOString().split('T')[0]
    }
    return null
}

export async function GET(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value
        if (!address) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        // Get user
        const userResult = await query('SELECT id FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        const userId = userResult.rows[0].id

        // Get or Create streak
        let streakResult = await query('SELECT * FROM user_streaks WHERE user_id = $1', [userId])
        if (streakResult.rows.length === 0) {
            await query(
                'INSERT INTO user_streaks (user_id, current_streak, highest_streak, last_claim_date, total_days_claimed) VALUES ($1, 0, 0, NULL, 0)',
                [userId]
            )
            streakResult = await query('SELECT * FROM user_streaks WHERE user_id = $1', [userId])
        }

        const streak = streakResult.rows[0]
        const today = getTodayUTC()
        const lastClaim = normalizeDate(streak.last_claim_date)

        const canClaim = !lastClaim || lastClaim !== today

        // Peek next reward
        const nextDay = Math.min(streak.current_streak + 1, 14)
        const nextReward = STREAK_REWARDS.find(r => r.day === nextDay)

        return NextResponse.json({
            currentStreak: streak.current_streak,
            highestStreak: streak.highest_streak,
            lastClaimDate: streak.last_claim_date,
            canClaim,
            nextReward
        })

    } catch (error: any) {
        console.error('Streak fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value
        if (!address) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const userResult = await query('SELECT id FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        const userId = userResult.rows[0].id

        // Get streak row
        const streakResult = await query('SELECT * FROM user_streaks WHERE user_id = $1', [userId])
        if (streakResult.rows.length === 0) return NextResponse.json({ error: 'Streak record missing' }, { status: 404 }) // Should be created by GET

        const streak = streakResult.rows[0]
        const today = getTodayUTC()
        const lastClaim = normalizeDate(streak.last_claim_date)

        if (lastClaim === today) {
            return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
        }

        // Logic
        // Yesterday DATE calculation for comparison
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterday = yesterdayDate.toISOString().split('T')[0]

        const isConsecutive = lastClaim === yesterday
        const newStreak = isConsecutive ? Math.min(streak.current_streak + 1, 14) : 1
        const newHighest = Math.max(newStreak, streak.highest_streak)

        // Reward
        const reward = STREAK_REWARDS.find(r => r.day === newStreak) || STREAK_REWARDS[0]

        // Update DB
        await query(
            `UPDATE user_streaks 
             SET current_streak = $1, 
                 highest_streak = $2,
                 last_claim_date = $3,
                 total_days_claimed = total_days_claimed + 1
             WHERE user_id = $4`,
            [newStreak, newHighest, today, userId]
        )

        // Give Credits
        if (reward?.credits) {
            await query('UPDATE users SET total_credits_earned = total_credits_earned + $1 WHERE id = $2', [reward.credits, userId])
        }

        return NextResponse.json({
            success: true,
            newStreak,
            reward: {
                credits: reward?.credits || 0,
                special: reward?.special || false
            }
        })

    } catch (error: any) {
        console.error('Streak claim error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
