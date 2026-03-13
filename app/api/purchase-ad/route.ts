import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tier, transaction_ref, amount, nullifier_hash, nullifierHash } = body
        const activeNullifier = nullifier_hash || nullifierHash

        console.log('[API] Ad banner purchase request:', {
            tier,
            amount,
            nullifierHash: activeNullifier?.substring(0, 10) + '...',
            transaction_ref
        })

        if (!activeNullifier) {
            console.error('[API] Missing nullifier_hash or nullifierHash')
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        if (!tier || tier < 1 || tier > 4) {
            console.error('[API] Invalid tier:', tier)
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
        }

        // Validate amount matches tier
        const expectedAmounts: Record<number, number> = {
            1: 15,
            2: 25,
            3: 35,
            4: 45
        }

        if (expectedAmounts[tier] !== amount) {
            console.error('[API] Invalid amount for tier:', tier, amount)
            return NextResponse.json({ error: 'Invalid amount for selected duration' }, { status: 400 })
        }

        // Calculate expiration date
        const weeks = tier === 4 ? 4 : tier
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (weeks * 7))

        // Log transaction and banner reservation
        const result = await query(
            `INSERT INTO ad_banners (world_id_nullifier, tier, amount, transaction_ref, status, expires_at, created_at)
             VALUES ($1, $2, $3, $4, 'pending_banner', $5, NOW())
             ON CONFLICT (transaction_ref) DO NOTHING
             RETURNING id`,
            [activeNullifier, tier, amount, transaction_ref, expiresAt.toISOString()]
        )

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 })
        }

        console.log('[API] Ad banner purchase successful, ID:', result.rows[0].id)

        return NextResponse.json({
            success: true,
            id: result.rows[0].id,
            expiresAt
        })
    } catch (error) {
        console.error('[API] Ad purchase error:', error)
        return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
    }
}
