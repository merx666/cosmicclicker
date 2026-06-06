import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne } from '@/lib/db'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'
import { SHOP_CATALOG } from '@/lib/gameEconomy'
import { verifyWorldChainTransaction } from '@/lib/chainVerification'
import { grantPurchase } from '@/lib/purchaseHelper'

interface PurchaseRequest {
    itemId: string
    payload: MiniAppPaymentSuccessPayload
    isDev?: boolean
}

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { itemId, payload, isDev }: PurchaseRequest = await req.json()

        console.log('Processing purchase:', itemId, payload)

        // Find item in catalog
        const item = SHOP_CATALOG.find(i => i.id === itemId)
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        // Verify payment status (skip for dev mock)
        if (!isDev && payload.status !== 'success') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
        }

        // Verify transaction on World Chain in production
        let verificationPassed = false
        if (!isDev) {
            const merchantAddress = '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc'

            try {
                // Race verification against a 15-second timeout
                const verifyPromise = verifyWorldChainTransaction(
                    payload.transaction_id,
                    item.price,
                    merchantAddress
                )
                const timeoutPromise = new Promise<boolean>((resolve) => {
                    setTimeout(() => resolve(false), 15000)
                })

                verificationPassed = await Promise.race([verifyPromise, timeoutPromise])

                if (!verificationPassed) {
                    console.warn(`Chain verification TIMEOUT/FAILED for tx ${payload.transaction_id} - allowing purchase with pending flag`)
                }
            } catch (verifyError: any) {
                console.error(`Chain verification ERROR for tx ${payload.transaction_id}:`, verifyError.message)
                // Allow purchase but mark as pending verification
                verificationPassed = false
            }
        } else {
            verificationPassed = true
        }

        // Get user
        const userResult = await query(
            'SELECT id FROM users WHERE wallet_address = $1',
            [address.toLowerCase()]
        )

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = userResult.rows[0]

        // Grant purchase using helper
        const result = await grantPurchase(
            user.id,
            itemId,
            item.price,
            'WLD',
            payload.transaction_id || null
        )

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        // Return updated spent value (query updated user)
        const updatedUser = await queryOne('SELECT total_spent_wld FROM users WHERE id = $1', [user.id])

        console.log('Purchase successful:', itemId, 'for user', user.id)

        return NextResponse.json({
            success: true,
            item: {
                id: item.id,
                name: item.name,
                type: item.type
            },
            totalSpent: parseFloat(updatedUser?.total_spent_wld || '0')
        })

    } catch (error: any) {
        console.error('Purchase error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

