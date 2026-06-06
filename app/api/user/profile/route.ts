import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Get or create user
        let result = await query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [address.toLowerCase()]
        )

        if (result.rows.length === 0) {
            // Create new user
            result = await query(
                `INSERT INTO users (world_id_nullifier, wallet_address) 
                 VALUES ($1, $1) 
                 RETURNING *`,
                [address.toLowerCase()]
            )

            // Create streak record
            await query(
                'INSERT INTO user_streaks (user_id) VALUES ($1)',
                [result.rows[0].id]
            )
        } else {
            // Update last login
            await query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [result.rows[0].id]
            )
        }

        const user = result.rows[0]

        // Get streak info
        const streakResult = await query(
            'SELECT * FROM user_streaks WHERE user_id = $1',
            [user.id]
        )

        // Get inventory
        const inventoryResult = await query(
            'SELECT * FROM user_inventory WHERE user_id = $1',
            [user.id]
        )

        return NextResponse.json({
            user: {
                id: user.id,
                address: user.wallet_address,
                highestWave: user.highest_wave || 0,
                totalCredits: parseInt(user.total_credits_earned || '0', 10),
                totalSpent: parseFloat(user.total_spent_wld || '0'),
                isPremium: user.is_premium || false,
                gamesPlayed: user.total_games_played || 0
            },
            streak: streakResult.rows[0] || null,
            inventory: inventoryResult.rows
        })

    } catch (error: any) {
        console.error('User fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
