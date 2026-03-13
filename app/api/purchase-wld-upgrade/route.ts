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

        // Validate amounts and IDs
        const expectedAmounts: Record<string, number> = {
            'void_core_multiplier': 10,
            'overclocked_drone': 15
        }

        if (expectedAmounts[upgrade_id] !== amount) {
            console.error('[API] Invalid amount for upgrade:', upgrade_id, amount)
            return NextResponse.json({ error: 'Invalid amount for selected upgrade' }, { status: 400 })
        }

        // We use direct RAW SQL to append the upgrade to the jsonb array securely
        // We also log the transaction reference into a new table or just rely on the fact that if it's purchased it's in the array.
        // Wait, to prevent replay attacks we must ensure transaction_ref is unique.
        // Let's create `wld_transactions` table in our migration. 
        // For now, let's insert into a tracking table (which we will create in the migration)

        // Let's do a transaction-like approach or just insert into wld_transactions and if it succeeds, update user

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
