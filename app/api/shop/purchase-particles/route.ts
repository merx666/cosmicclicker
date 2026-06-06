import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne, transaction } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
        }

        const { itemId } = await req.json()
        if (itemId !== 'click_multiplier_500') {
            return NextResponse.json({ error: 'Nieprawidłowy przedmiot do zakupu za cząsteczki' }, { status: 400 })
        }

        const costParticles = 120000
        const durationMs = 180000 // 3 minutes

        // Process deduction and grant inside a transaction
        const result = await transaction(async (client) => {
            const user = await client.query(
                'SELECT id, particles FROM users WHERE wallet_address = $1',
                [address.toLowerCase()]
            )

            if (user.rows.length === 0) {
                throw new Error('Użytkownik nie znaleziony')
            }

            const currentParticles = Number(user.rows[0].particles || 0)
            if (currentParticles < costParticles) {
                throw new Error('Niewystarczająca ilość cząsteczek (wymagane 120,000)')
            }

            // Deduct particles and set booster_click_multiplier_until in achievements
            const expiryTime = Date.now() + durationMs
            await client.query(
                `UPDATE users 
                 SET particles = particles - $1,
                     achievements = COALESCE(achievements, '{}'::jsonb) || jsonb_build_object('booster_click_multiplier_until', $2::bigint)
                 WHERE id = $3`,
                [costParticles, expiryTime, user.rows[0].id]
            )

            // Record purchase
            await client.query(
                `INSERT INTO purchases (user_id, item_id, item_type, price_wld, transaction_hash, currency, price_in_currency)
                 VALUES ($1, $2, $3, 0, null, 'PARTICLES', $4)`,
                [user.rows[0].id, itemId, 'boost', costParticles]
            )

            // Fetch updated state to return
            const updatedUser = await client.query(
                'SELECT particles, achievements FROM users WHERE id = $1',
                [user.rows[0].id]
            )

            return {
                success: true,
                particles: Number(updatedUser.rows[0].particles),
                achievements: updatedUser.rows[0].achievements,
                expiryTime
            }
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Particle purchase error:', error)
        return NextResponse.json({ error: error.message || 'Zakup nie powiódł się' }, { status: 400 })
    }
}
