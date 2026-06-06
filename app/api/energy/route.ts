import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Energy Configuration
const MAX_ENERGY = 5
const REFILL_TIME_MINUTES = 30

export async function POST(req: NextRequest) {
    try {
        const { userId, action } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Ensure user exists in energy table
        const energyRecord = await query(
            'SELECT * FROM user_energy WHERE user_id = $1',
            [userId]
        )

        if (energyRecord.rows.length === 0) {
            // Initialize energy record if missing
            await query(
                'INSERT INTO user_energy (user_id, current_energy, max_energy, last_refill) VALUES ($1, $2, $2, NOW())',
                [userId, MAX_ENERGY]
            )
        }

        // Calculate natural refill
        await calculateNaturalRefill(userId)

        if (action === 'status') {
            const updatedRecord = await query(
                'SELECT * FROM user_energy WHERE user_id = $1',
                [userId]
            )
            return NextResponse.json(updatedRecord.rows[0])
        }

        if (action === 'use') {
            const current = await query(
                'SELECT current_energy, max_energy FROM user_energy WHERE user_id = $1',
                [userId]
            )

            if (current.rows[0].current_energy >= 1) {
                await query(
                    'UPDATE user_energy SET current_energy = current_energy - 1 WHERE user_id = $1',
                    [userId]
                )

                // If this was full, set the refill start time
                if (current.rows[0].current_energy === current.rows[0].max_energy) {
                    await query(
                        'UPDATE user_energy SET last_refill = NOW() WHERE user_id = $1',
                        [userId]
                    )
                }

                return NextResponse.json({ success: true, message: 'Energy used' })
            } else {
                return NextResponse.json({ success: false, message: 'Not enough energy', error: 'insufficient_energy' }, { status: 403 })
            }
        }

        if (action === 'upgrade_max') {
            await query(
                'UPDATE user_energy SET max_energy = max_energy + 5, current_energy = current_energy + 5 WHERE user_id = $1',
                [userId]
            )
            return NextResponse.json({ success: true, message: 'Max energy upgraded' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Energy API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

async function calculateNaturalRefill(userId: string) {
    const record = await query('SELECT * FROM user_energy WHERE user_id = $1', [userId])

    if (record.rows.length === 0) return

    const { current_energy, max_energy, last_refill } = record.rows[0]

    if (current_energy >= max_energy) {
        // Reset refill timer to now so it starts ticking when energy is used
        await query('UPDATE user_energy SET last_refill = NOW() WHERE user_id = $1', [userId])
        return
    }

    const now = new Date()
    const last = new Date(last_refill)
    const diffMs = now.getTime() - last.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    const energyToAdd = Math.floor(diffMinutes / REFILL_TIME_MINUTES)

    if (energyToAdd > 0) {
        const newEnergy = Math.min(max_energy, current_energy + energyToAdd)

        // Correct way to keep the cycle
        const timeAdded = energyToAdd * REFILL_TIME_MINUTES * 60 * 1000
        const newLastRefill = new Date(last.getTime() + timeAdded)

        await query(
            'UPDATE user_energy SET current_energy = $1, last_refill = $2 WHERE user_id = $3',
            [newEnergy, newLastRefill, userId]
        )
    }
}
