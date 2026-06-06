import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const user = await queryOne('SELECT id, telegram_id FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (!user) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        const rewardParticles = 10000 // 10k Particles as reward!

        // Atomic increment of user particles
        const updateRes = await query(
            `UPDATE users 
             SET particles = particles + $1, 
                 total_particles_collected = total_particles_collected + $1,
                 updated_at = NOW() 
             WHERE id = $2 RETURNING particles`,
            [rewardParticles, user.id]
        )

        const updatedUser = updateRes.rows[0]

        console.log(`[Rewarded Ad API] Granted ${rewardParticles} Particles to user ${user.id} (TG: ${user.telegram_id})`)

        return NextResponse.json({
            success: true,
            reward: rewardParticles,
            particles: Number(updatedUser.particles)
        })

    } catch (e: any) {
        console.error('[Rewarded Ad API] Error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
