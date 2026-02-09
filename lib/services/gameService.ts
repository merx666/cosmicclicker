import { query, queryOne } from '@/lib/db'

// Typed result for service operations
export type ServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; statusCode: number }

// Type for game state update payload
export interface GameStateUpdate {
    particles?: number
    particles_per_click?: number
    particles_per_second?: number
    total_clicks?: number
    total_particles_collected?: number
    total_passive_particles?: number
    upgrade_click_power?: number
    upgrade_auto_collector?: number
    upgrade_multiplier?: number
    upgrade_offline?: number
    premium_particle_skin?: string
    premium_background_theme?: string
    unlocked_skins?: string[]
    unlocked_themes?: string[]
    premium_auto_save?: boolean
    premium_statistics?: boolean
    premium_notifications?: boolean
    premium_lucky_particle?: boolean
    premium_offline_earnings?: boolean
    premium_daily_bonus?: boolean
    premium_vip?: boolean
    vip_tier?: number
    last_daily_bonus_time?: string | null
    login_streak?: number
    daily_clicks?: number
    daily_passive_particles?: number
    daily_particles_collected?: number
    last_daily_reset?: string | null
    claimed_missions?: string[]
}

export class GameService {
    static async getGameState(hash: string): Promise<ServiceResult<any>> {
        if (!hash) {
            return { success: false, error: 'Missing hash parameter', statusCode: 400 }
        }

        const user = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [hash]
        )

        if (!user) {
            return { success: false, error: 'User not found', statusCode: 404 }
        }

        return { success: true, data: user }
    }

    static async saveGameState(hash: string, gameData: GameStateUpdate): Promise<ServiceResult<any>> {
        if (!hash) {
            return { success: false, error: 'Missing nullifier_hash', statusCode: 400 }
        }

        // 1. Fetch current user state for validation
        const currentUser = await queryOne(
            'SELECT * FROM users WHERE world_id_nullifier = $1',
            [hash]
        )

        if (!currentUser) {
            return { success: false, error: 'User not found', statusCode: 404 }
        }

        // 2. Security: Block sensitive fields
        const BLOCKED_FIELDS = ['id', 'created_at', 'updated_at', 'world_id_nullifier', 'wallet_address', 'last_login']
        const allowedKeys = Object.keys(gameData).filter(k => !BLOCKED_FIELDS.includes(k))

        if (allowedKeys.length === 0) {
            return { success: false, error: 'No data to update', statusCode: 400 }
        }

        // 3. Security: Anti-Cheat Cap & Sanitization
        const MAX_GAIN_PER_SAVE = 500000

        // Identify numeric fields to sanitize
        const NUMERIC_FIELDS = ['particles', 'particles_per_click', 'particles_per_second', 'total_clicks',
            'total_particles_collected', 'total_passive_particles', 'daily_clicks',
            'daily_passive_particles', 'daily_particles_collected', 'total_wld_claimed', 'login_streak']

        // Identify JSON fields to stringify (fix for node-postgres array issue)
        const JSON_FIELDS = ['unlocked_skins', 'unlocked_themes', 'claimed_missions']

        // Create a copy to modify
        const sanitizedData: Record<string, any> = { ...gameData }

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
            return { success: true, data: { saved: false, reason: 'regression_detected' } }
        }

        // Protect VIP Status
        if (currentUser.premium_vip && !sanitizedData.premium_vip) {
            sanitizedData.premium_vip = true
        }

        // 4. Build dynamic UPDATE query
        const setClause = allowedKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')
        const values = [...allowedKeys.map(k => sanitizedData[k]), hash]

        const result = await query(
            `UPDATE users SET ${setClause}, updated_at = NOW() WHERE world_id_nullifier = $${allowedKeys.length + 1} RETURNING *`,
            values
        )

        return { success: true, data: result.rows[0] }
    }
}
