import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await query(
            `SELECT
                world_id_nullifier,
                total_particles_collected,
                vip_tier
             FROM users
             ORDER BY total_particles_collected DESC
             LIMIT 50`
        )

        const leaderboard = result.rows.map((row) => ({
            id: row.world_id_nullifier,
            // Format name: "User ABCD"
            name: `User ${row.world_id_nullifier.substring(0, 4).toUpperCase()}`,
            score: Number(row.total_particles_collected),
            vip: row.vip_tier > 0
        }))

        return NextResponse.json(leaderboard)
    } catch (error: any) {
        console.error('Leaderboard error:', error)
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }
}
