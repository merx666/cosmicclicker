import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { query, queryOne, transaction } from '@/lib/db'

function verifyTelegramInitData(initData: string, botToken: string): boolean {
    try {
        const params = new URLSearchParams(initData)
        const hash = params.get('hash')
        if (!hash) return false

        // Sort key-value pairs alphabetically excluding hash
        const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort()
        const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n')

        // Secret key is HMAC-SHA256 of botToken using constant string "WebAppData"
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
        
        // Calculated hash is HMAC-SHA256 of dataCheckString using secretKey
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

        return calculatedHash === hash
    } catch (e) {
        console.error('[Telegram Auth] Verification error:', e)
        return false
    }
}

function getTelegramSyntheticAddress(telegramId: number): string {
    const hex = telegramId.toString(16).padStart(40, '0')
    return `0x${hex}`
}

export async function POST(req: NextRequest) {
    try {
        const { initData } = await req.json()
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 400 })
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            console.error('[Telegram Auth] Error: TELEGRAM_BOT_TOKEN not configured')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Verify signature
        const isValid = verifyTelegramInitData(initData, botToken)
        if (!isValid) {
            console.error('[Telegram Auth] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Parse user data from initData
        const params = new URLSearchParams(initData)
        const userJson = params.get('user')
        if (!userJson) {
            return NextResponse.json({ error: 'User data missing in initData' }, { status: 400 })
        }

        const tgUser = JSON.parse(userJson)
        const telegramId = tgUser.id
        const telegramUsername = tgUser.username || ''
        const displayName = tgUser.username || tgUser.first_name || `TGUser_${telegramId}`

        if (!telegramId) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        const startParam = params.get('start_param') || ''
        let referralClaimed = false
        let referrerUsername = ''

        // Wyciągamy telegram_id polecającego
        let referrerTgId: number | null = null
        if (startParam.startsWith('ref_')) {
            const tgIdStr = startParam.substring(4)
            const parsed = parseInt(tgIdStr, 10)
            if (!isNaN(parsed)) {
                referrerTgId = parsed
            }
        }

        const syntheticAddress = getTelegramSyntheticAddress(telegramId)

        // Find or create user
        let user = await queryOne('SELECT * FROM users WHERE telegram_id = $1', [telegramId])

        if (!user) {
            // Check if user exists by wallet address (e.g. if they connected wallet before)
            user = await queryOne('SELECT * FROM users WHERE wallet_address = $1', [syntheticAddress.toLowerCase()])

            if (!user) {
                // Sprawdzamy czy mamy polecającego i pobieramy jego dane przed transakcją
                let referrer = null
                if (referrerTgId && referrerTgId !== telegramId) {
                    referrer = await queryOne('SELECT id, telegram_username, username FROM users WHERE telegram_id = $1', [referrerTgId])
                }

                // Create new Telegram user
                await transaction(async (client) => {
                    const startParticles = referrer ? 25000 : 0

                    const insertRes = await client.query(
                        `INSERT INTO users (telegram_id, telegram_username, wallet_address, username, world_id_nullifier, particles, total_particles_collected) 
                         VALUES ($1, $2, $3, $4, $3, $5, $5) 
                         RETURNING *`,
                        [telegramId, telegramUsername, syntheticAddress.toLowerCase(), displayName, startParticles]
                    )
                    user = insertRes.rows[0]

                    // Create streak record
                    await client.query(
                        'INSERT INTO user_streaks (user_id) VALUES ($1)',
                        [user.id]
                    )

                    // Jeśli polecający istnieje, przyznajemy mu 50,000 cząsteczek
                    if (referrer) {
                        await client.query(
                            `UPDATE users 
                             SET particles = particles + 50000, 
                                 total_particles_collected = total_particles_collected + 50000,
                                 updated_at = NOW() 
                             WHERE id = $1`,
                            [referrer.id]
                        )
                        referralClaimed = true
                        referrerUsername = referrer.telegram_username || referrer.username || 'znajomy'
                    }
                })
            } else {
                // Link existing user to telegram
                const updateRes = await query(
                    'UPDATE users SET telegram_id = $1, telegram_username = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                    [telegramId, telegramUsername, user.id]
                )
                user = updateRes.rows[0]
            }
        } else {
            // Update telegram username if changed, last login time, and ensure world_id_nullifier is set
            const updateRes = await query(
                `UPDATE users 
                 SET telegram_username = $1, 
                     last_login = CURRENT_TIMESTAMP, 
                     world_id_nullifier = COALESCE(world_id_nullifier, wallet_address),
                     updated_at = NOW() 
                 WHERE id = $2 RETURNING *`,
                [telegramUsername, user.id]
            )
            user = updateRes.rows[0]
        }

        // Set session cookie
        const jar = await cookies()
        jar.set('auth_address', syntheticAddress.toLowerCase(), {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 604800 // 7 days
        })

        console.log(`[Telegram Auth] Successful login: TG ID ${telegramId} -> Synthetic Address: ${syntheticAddress}`)

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                address: user.wallet_address,
                telegramId,
                telegramUsername
            },
            referralClaimed,
            referrerUsername
        })

    } catch (e: any) {
        console.error('[Telegram Auth] Error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
