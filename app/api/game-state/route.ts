import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// GET - Load game state
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hash = searchParams.get('hash')

        if (!hash) {
            return NextResponse.json({ error: 'Missing hash parameter' }, { status: 400 })
        }

        const user = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [hash]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)

    } catch (error: any) {
        console.error('GET game-state error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Save game state
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nullifier_hash, ...gameData } = body

        if (!nullifier_hash) {
            return NextResponse.json({ error: 'Missing nullifier_hash' }, { status: 400 })
        }

        // 1. Fetch current user state for validation
        const currentUser = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 2. Security: Block sensitive fields
        const BLOCKED_FIELDS = ['id', 'created_at', 'updated_at', 'world_id_nullifier', 'wallet_address', 'last_login']
        const allowedKeys = Object.keys(gameData).filter(k => !BLOCKED_FIELDS.includes(k))

        if (allowedKeys.length === 0) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 })
        }

        // 3. Security: Anti-Cheat Cap & Sanitization
        const MAX_GAIN_PER_SAVE = 500000

        // Identify numeric fields to sanitize
        const NUMERIC_FIELDS = ['particles', 'particles_per_click', 'particles_per_second', 'total_clicks',
            'total_particles_collected', 'total_passive_particles', 'daily_clicks',
            'daily_passive_particles', 'daily_particles_collected', 'total_wld_claimed', 'login_streak']

        // Identify JSON fields to stringify (fix for node-postgres array issue)
        const JSON_FIELDS = ['unlocked_skins', 'unlocked_themes', 'claimed_missions']

        if (gameData.particles !== undefined) {
            const newParticles = Number(gameData.particles)
            const currentParticles = Number(currentUser.particles || 0)
            const delta = newParticles - currentParticles

            // Cap main particles
            if (delta > MAX_GAIN_PER_SAVE) {
                console.warn(`[Anti-Cheat] Capped particle gain for ${nullifier_hash.substring(0, 10)}... Delta: ${delta}`)
                gameData.particles = currentParticles + MAX_GAIN_PER_SAVE
            }
        }

        // Sanitize ALL fields & Protect against Regression
        for (const key of allowedKeys) {
            // A. Cap/Fix Overflows for other numeric stats
            if (NUMERIC_FIELDS.includes(key)) {
                let val = Number(gameData[key])
                if (isNaN(val) || val > 9000000000000000000) { val = 0 }

                // Special case: sync total_particles roughly to particles if it was broken
                if (key === 'total_particles_collected' && val === 0 && Number(gameData.particles) > 0) {
                    val = Number(gameData.particles)
                }
                gameData[key] = val
            }

            // B. Stringify JSON arrays/objects for Postgres
            if (JSON_FIELDS.includes(key) && typeof gameData[key] === 'object') {
                gameData[key] = JSON.stringify(gameData[key])
            }
        }

        // REGRESSION CHECK: Prevent overwriting good data with a "reset" state (0)
        // This stops the frontend from wiping the DB if it fails to load first.
        const dbTotalCollected = Number(currentUser.total_particles_collected || 0)
        const newTotalCollected = Number(gameData.total_particles_collected || 0)

        // If trying to save a state with SIGNIFICANTLY less progress (e.g. 0 vs 1M), block it.
        // Allow small legitimate discrepancies, but block "wipes".
        if (dbTotalCollected > 1000 && newTotalCollected < 100) {
            console.warn(`[Save Protection] Blocked wipe for ${nullifier_hash}. DB: ${dbTotalCollected}, New: ${newTotalCollected}`)
            return NextResponse.json({ success: true, saved: false, reason: 'regression_detected' })
        }

        // Protect VIP Status: Once VIP, always VIP
        if (currentUser.premium_vip && !gameData.premium_vip) {
            gameData.premium_vip = true
        }

        // 4. Build dynamic UPDATE query
        const setClause = allowedKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')
        // Use allowedKeys to map values from validated gameData
        const values = [...allowedKeys.map(k => gameData[k]), nullifier_hash]

        const result = await query(
            `UPDATE users SET ${setClause}, updated_at = NOW() WHERE world_id_nullifier = $${allowedKeys.length + 1} RETURNING *`,
            values
        )

        return NextResponse.json({ success: true, data: result.rows[0] })

    } catch (error: any) {
        console.error('POST game-state error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
