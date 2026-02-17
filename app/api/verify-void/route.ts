
import { NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { getVoidBalance, getVipLevelFromBalance, VIP_LEVELS } from '@/lib/token'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nullifier_hash } = body

        if (!nullifier_hash) {
            return NextResponse.json({ error: 'Missing nullifier_hash' }, { status: 400 })
        }

        // 1. Get user wallet
        const user = await queryOne(
            'SELECT wallet_address, vip_tier FROM users WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )

        // If no wallet linked, we can't check
        if (!user || !user.wallet_address) {
            return NextResponse.json({ error: 'Wallet not linked. Please connect wallet.' }, { status: 404 })
        }

        // 2. Check Balance
        const balance = await getVoidBalance(user.wallet_address)
        const newTier = getVipLevelFromBalance(balance)

        // 3. Update DB
        // We sync strict: if balance drops, tier drops.
        const isVip = newTier > 0

        // Only update if changed
        if (newTier !== user.vip_tier) {
            await query(
                `UPDATE users 
                 SET vip_tier = $1, 
                     premium_vip = $2, 
                     updated_at = NOW() 
                 WHERE world_id_nullifier = $3`,
                [newTier, isVip, nullifier_hash]
            )
        }

        return NextResponse.json({
            success: true,
            balance,
            tier: newTier,
            isVip,
            vipLevelName: newTier === 2 ? 'GOLD' : (newTier === 1 ? 'SILVER' : 'NONE'),
            updated: newTier !== user.vip_tier
        })

    } catch (error: any) {
        console.error('Verify VOID error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
