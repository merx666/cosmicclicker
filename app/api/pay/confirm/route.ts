import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { payload } = body
        const reference = payload.reference

        if (!reference || !payload.transaction_id) {
            return NextResponse.json({ error: 'Missing reference or transaction_id' }, { status: 400 })
        }

        // Verify with World App API
        const response = await fetch(
            `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.WORLD_APP_ID}`,
            { method: 'GET' }
        )

        const transactionInfo = await response.json()

        if (transactionInfo.reference !== reference || transactionInfo.status !== 'SUCCESS') {
            return NextResponse.json({ error: 'Transaction invalid or not successful' }, { status: 400 })
        }

        // Check local DB
        const tx = await queryOne('SELECT * FROM minikit_transactions WHERE id = $1', [reference])
        
        if (!tx) {
            return NextResponse.json({ error: 'Transaction not found locally' }, { status: 404 })
        }
        if (tx.status === 'completed') {
            return NextResponse.json({ success: true, message: 'Already completed' })
        }

        // Mark as completed
        await query('UPDATE minikit_transactions SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', reference])

        const now = Date.now()
        let bypassUntil = null
        let isPerm = false

        switch (tx.package_id) {
            case 'boost_1h': bypassUntil = new Date(now + 1 * 60 * 60 * 1000); break;
            case 'overdrive_12h': bypassUntil = new Date(now + 12 * 60 * 60 * 1000); break;
            case 'void_master_7d': bypassUntil = new Date(now + 7 * 24 * 60 * 60 * 1000); break;
            case 'singularity_perm': isPerm = true; break;
        }

        if (isPerm) {
            await query('UPDATE users SET premium_vip = true, hourly_clicks = 0 WHERE world_id_nullifier = $1', [tx.user_nullifier])
        } else if (bypassUntil) {
            await query('UPDATE users SET bypass_until = $1, hourly_clicks = 0 WHERE world_id_nullifier = $2', [bypassUntil.toISOString(), tx.user_nullifier])
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error confirming transaction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
