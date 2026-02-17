import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tier, transaction_ref, amount, nullifier_hash, nullifierHash } = body
        const activeNullifier = nullifier_hash || nullifierHash

        console.log('[API] Tier purchase request:', {
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

        // Update user's tier and set premium_vip to true
        const result = await query(
            `UPDATE users 
             SET vip_tier = $1, 
                 premium_vip = true,
                 premium_lucky_particle = true,
                 premium_offline_earnings = true,
                 premium_daily_bonus = true,
                 unlocked_skins = $2::jsonb,
                 unlocked_themes = $3::jsonb
             WHERE world_id_nullifier = $4
             RETURNING vip_tier`,
            [tier, JSON.stringify(['default', 'rainbow', 'gold']), JSON.stringify(['default', 'nebula', 'galaxy']), activeNullifier]
        )

        if (result.rowCount === 0) {
            console.error('[API] User not found for tier update:', activeNullifier)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        console.log('[API] Tier updated:', result.rows[0])

        // Log transaction
        await query(
            `INSERT INTO tier_purchases (world_id_nullifier, tier, amount, transaction_ref, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (transaction_ref) DO UPDATE SET created_at = NOW()`,
            [activeNullifier, tier, amount, transaction_ref]
        )

        console.log('[API] Tier purchase successful')
        return NextResponse.json({ success: true, tier })
    } catch (error) {
        console.error('[API] Tier purchase error:', error)
        return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
    }
}
