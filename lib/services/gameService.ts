import { query, queryOne } from '@/lib/db'

export class GameService {
    static async getGameState(hash: string) {
        if (!hash) {
            throw new Error('Missing hash parameter')
        }

        const user = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [hash]
        )

        return user
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async saveGameState(hash: string, gameData: any) {
        if (!hash) {
            throw new Error('Missing nullifier_hash')
        }

        // 1. Fetch current user state for validation
        const currentUser = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [hash]
        )

        if (!currentUser) {
            throw new Error('User not found')
        }

        // 2. Security: Block sensitive fields
        const BLOCKED_FIELDS = ['id', 'created_at', 'updated_at', 'world_id_nullifier', 'wallet_address', 'last_login']
        const allowedKeys = Object.keys(gameData).filter(k => !BLOCKED_FIELDS.includes(k))

        if (allowedKeys.length === 0) {
            throw new Error('No data to update')
        }

        // 3. Security: Anti-Cheat Cap & Sanitization
        const MAX_GAIN_PER_SAVE = 500000

        // Identify numeric fields to sanitize
        const NUMERIC_FIELDS = ['particles', 'particles_per_click', 'particles_per_second', 'total_clicks',
            'total_particles_collected', 'total_passive_particles', 'daily_clicks',
            'daily_passive_particles', 'daily_particles_collected', 'total_wld_claimed', 'login_streak']

        // Identify JSON fields to stringify (fix for node-postgres array issue)
        const JSON_FIELDS = ['unlocked_skins', 'unlocked_themes', 'claimed_missions']

        // Create a copy to modify (using gameData values directly)
        const sanitizedData = { ...gameData }

        if (sanitizedData.particles !== undefined) {
            const newParticles = Number(sanitizedData.particles)
            const currentParticles = Number(currentUser.particles || 0)
            const delta = newParticles - currentParticles

            // Cap main particles
            if (delta > MAX_GAIN_PER_SAVE) {
                console.warn(`[Anti-Cheat] Capped particle gain for ${hash.substring(0, 10)}... Delta: ${delta}`)
                sanitizedData.particles = currentParticles + MAX_GAIN_PER_SAVE
            }
        }

        // Sanitize ALL fields & Protect against Regression
        for (const key of allowedKeys) {
            // A. Cap/Fix Overflows for other numeric stats
            if (NUMERIC_FIELDS.includes(key)) {
                let val = Number(sanitizedData[key])
                if (isNaN(val) || val > 9000000000000000000) { val = 0 }

                // Special case: sync total_particles roughly to particles if it was broken
                if (key === 'total_particles_collected' && val === 0 && Number(sanitizedData.particles) > 0) {
                    val = Number(sanitizedData.particles)
                }
                sanitizedData[key] = val
            }

            // B. Stringify JSON arrays/objects for Postgres
            if (JSON_FIELDS.includes(key) && typeof sanitizedData[key] === 'object') {
                sanitizedData[key] = JSON.stringify(sanitizedData[key])
            }
        }

        // REGRESSION CHECK
        const dbTotalCollected = Number(currentUser.total_particles_collected || 0)
        const newTotalCollected = Number(sanitizedData.total_particles_collected || 0)

        if (dbTotalCollected > 1000 && newTotalCollected < 100) {
            console.warn(`[Save Protection] Blocked wipe for ${hash}. DB: ${dbTotalCollected}, New: ${newTotalCollected}`)
            return { success: true, saved: false, reason: 'regression_detected' }
        }

        // Protect VIP Status
        if (currentUser.premium_vip && !sanitizedData.premium_vip) {
            sanitizedData.premium_vip = true
        }

        // 4. Build dynamic UPDATE query
        const setClause = allowedKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')
        // Use allowedKeys to map values from sanitizedData
        const values = [...allowedKeys.map(k => sanitizedData[k]), hash]

        const result = await query(
            `UPDATE users SET ${setClause}, updated_at = NOW() WHERE world_id_nullifier = $${allowedKeys.length + 1} RETURNING *`,
            values
        )

        return { success: true, data: result.rows[0] }
    }
}
