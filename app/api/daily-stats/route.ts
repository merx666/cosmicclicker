import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0]

        const stats = await queryOne<{ total_wld_claimed: number; conversion_count: number }>(
            'SELECT total_wld_claimed, conversion_count FROM daily_conversions WHERE conversion_date = $1',
            [today]
        )

        const MAX_DAILY_WLD = 7 // Adjusted to 7 WLD daily limit

        // Check for active cooldown from previous limit reach
        const lastLimit = await queryOne<{ limit_reached_at: string }>(
            'SELECT limit_reached_at FROM daily_conversions ORDER BY conversion_date DESC LIMIT 1'
        )

        let isCooldown = false
        if (lastLimit?.limit_reached_at) {
            const reachedAt = new Date(lastLimit.limit_reached_at).getTime()
            const now = Date.now()
            if (now - reachedAt < 24 * 60 * 60 * 1000) {
                isCooldown = true
            }
        }

        const claimed = Number(stats?.total_wld_claimed || 0)
        const conversions = Number(stats?.conversion_count || 0)
        const limitReached = claimed >= MAX_DAILY_WLD || isCooldown

        return NextResponse.json({
            totalClaimed: claimed,
            maxDaily: MAX_DAILY_WLD,
            remaining: limitReached ? 0 : MAX_DAILY_WLD - claimed,
            conversionsToday: conversions,
            limitReached: limitReached
        })

    } catch (error) {
        console.error('Daily stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 })
    }
}
