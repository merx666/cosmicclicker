import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from '@worldcoin/minikit-js'
import { query } from '@/lib/db'

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}

export async function POST(req: NextRequest) {
    try {
        // Check maintenance mode
        if (process.env.MAINTENANCE_MODE === 'true') {
            console.log('[WorldID Verify] Maintenance mode active, rejecting verification')
            return NextResponse.json(
                { error: 'Season 2 update in progress. Please try again later.' },
                { status: 503 }
            )
        }

        const body = (await req.json()) as IRequestPayload
        const { payload, nonce } = body

        console.log('[WorldID Verify] Wallet Authentication verification request:', { nonce })

        if (!payload || !nonce) {
            console.error('[WorldID Verify] Missing payload or nonce')
            return NextResponse.json(
                { error: 'Missing payload or nonce in request body' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()
        const storedNonce = cookieStore.get('siwe')?.value

        if (nonce !== storedNonce) {
            console.error('[WorldID Verify] Invalid nonce:', { expected: storedNonce, received: nonce })
            return NextResponse.json(
                { error: 'Invalid nonce' },
                { status: 400 }
            )
        }

        let validMessage
        try {
            console.log('[WorldID Verify] Verifying SIWE message...')
            validMessage = await verifySiweMessage(payload, nonce)
        } catch (error: any) {
            console.error('[WorldID Verify] Error verifying SIWE message:', error)
            return NextResponse.json(
                { error: error.message || 'Error verifying SIWE message' },
                { status: 400 }
            )
        }

        if (!validMessage.isValid) {
            console.error('[WorldID Verify] SIWE Verification failed')
            return NextResponse.json(
                { error: 'Invalid SIWE signature' },
                { status: 400 }
            )
        }

        // Extract wallet address from the verified proof
        const walletAddress = payload.address

        if (!walletAddress) {
            console.error('[WorldID Verify] Missing wallet_address in payload:', payload)
            return NextResponse.json(
                { error: 'Missing wallet_address from authentication' },
                { status: 400 }
            )
        }

        console.log('[WorldID Verify] Creating/updating user with wallet address:', walletAddress)

        // The old app was using nullifier hash as user identifier. By inserting the wallet address into world_id_nullifier
        // column, we can avoid full DB migration. We also update `wallet_address` since other endpoints query it.
        const result = await query(
            `INSERT INTO users (world_id_nullifier, wallet_address, last_login)
             VALUES ($1, $1, NOW())
             ON CONFLICT (world_id_nullifier) 
             DO UPDATE SET wallet_address = $1, last_login = NOW(), updated_at = NOW()
             RETURNING id`,
            [walletAddress]
        )

        const user = result.rows[0]

        console.log('[WorldID Verify] User created/updated successfully:', user?.id)

        return NextResponse.json({
            success: true,
            userAddress: walletAddress,
            userId: user.id
        })

    } catch (error: any) {
        console.error('[WorldID Verify] Unexpected error:', error)
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
