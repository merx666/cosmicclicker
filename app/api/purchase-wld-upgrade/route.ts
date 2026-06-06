import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { upgrade_id, transaction_ref, amount, nullifier_hash, nullifierHash } = body
        const activeNullifier = nullifier_hash || nullifierHash

        console.log('[API] WLD Upgrade purchase request:', {
            upgrade_id,
            amount,
            nullifierHash: activeNullifier?.substring(0, 10) + '...',
            transaction_ref
        })

        if (!activeNullifier) {
            console.error('[API] Missing nullifier_hash')
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        if (!upgrade_id) {
            console.error('[API] Missing upgrade_id')
            return NextResponse.json({ error: 'Invalid upgrade' }, { status: 400 })
        }

        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

        // Validate amounts and IDs based on platform
        if (isTelegram) {
            const expectedStars: Record<string, number> = {
                'void_core_multiplier': 300,
                'overclocked_drone': 600
            }
            if (expectedStars[upgrade_id] !== amount) {
                return NextResponse.json({ error: 'Invalid Stars amount for selected upgrade' }, { status: 400 })
            }
        } else {
            const expectedAmounts: Record<string, number> = {
                'void_core_multiplier': 10,
                'overclocked_drone': 15
            }
            if (expectedAmounts[upgrade_id] !== amount) {
                console.error('[API] Invalid amount for upgrade:', upgrade_id, amount)
                return NextResponse.json({ error: 'Invalid amount for selected upgrade' }, { status: 400 })
            }
        }

        // Verify transaction
        if (isTelegram) {
            const user = await query(
                'SELECT id FROM users WHERE world_id_nullifier = $1',
                [activeNullifier]
            )
            if ((user.rowCount ?? 0) === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }
            
            const purchase = await query(
                'SELECT id FROM purchases WHERE transaction_hash = $1 AND item_id = $2 AND user_id = $3',
                [transaction_ref, upgrade_id, user.rows[0].id]
            )
            if ((purchase.rowCount ?? 0) === 0) {
                return NextResponse.json({ error: 'Płatność Stars nie została zweryfikowana.' }, { status: 400 })
            }
        } else {
            // For WorldApp, insert tracking into wld_transactions
            try {
                await query(
                    `INSERT INTO wld_transactions (transaction_ref, world_id_nullifier, item_id, amount, created_at)
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [transaction_ref, activeNullifier, upgrade_id, amount]
                )
            } catch (e: any) {
                // Unique violation (transaction already processed)
                if (e.code === '23505') {
                    return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 })
                }
                throw e
            }
        }

        // Update the user's unlocked premium upgrades
        // We use JSONB array concatenation
        await query(
            `UPDATE users 
             SET unlocked_premium_upgrades = COALESCE(unlocked_premium_upgrades, '[]'::jsonb) || $1::jsonb 
             WHERE world_id_nullifier = $2 
             AND NOT (COALESCE(unlocked_premium_upgrades, '[]'::jsonb) ? $3)`,
            [JSON.stringify([upgrade_id]), activeNullifier, upgrade_id]
        )

        console.log('[API] Upgrade purchase successful:', upgrade_id)

        return NextResponse.json({
            success: true,
            upgrade_id
        })
    } catch (error) {
        console.error('[API] Upgrade purchase error:', error)
        return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
    }
}
