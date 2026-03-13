
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
        const voidTier = getVipLevelFromBalance(balance)

        // 3. Check Purchased Tier
        const purchasedResult = await queryOne(
            'SELECT MAX(tier) as max_tier FROM tier_purchases WHERE world_id_nullifier = $1',
            [nullifier_hash]
        )
        const purchasedTier = purchasedResult?.max_tier ? Number(purchasedResult.max_tier) : 0

        // 4. Update DB
        // User gets highest of what they hold in tokens vs what they purchased
        const newTier = Math.max(voidTier, purchasedTier)
        const isVip = newTier > 0

        // Update features and parity checking
        await query(
            `UPDATE users 
             SET vip_tier = $1, 
                 premium_vip = $2,
                 premium_lucky_particle = $2,
                 premium_offline_earnings = $2,
                 premium_daily_bonus = $2,
                 unlocked_skins = $3::jsonb,
                 unlocked_themes = $4::jsonb,
                 updated_at = NOW() 
             WHERE world_id_nullifier = $5`,
            [
                newTier,
                isVip,
                JSON.stringify(isVip ? ['default', 'rainbow', 'gold'] : ['default']),
                JSON.stringify(isVip ? ['default', 'nebula', 'galaxy'] : ['default']),
                nullifier_hash
            ]
        )

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
