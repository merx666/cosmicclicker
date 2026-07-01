import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from '@worldcoin/minikit-js'
import { query, transaction } from '@/lib/db'

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

        const body = (await req.json()) as IRequestPayload & { referrer?: string | null }
        const { payload, nonce, referrer: referrerAddress } = body

        console.log('[WorldID Verify] Wallet Authentication verification request:', { nonce, referrerAddress })

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

        let referralClaimed = false
        let referrerUsername = ''
        let userId: number | null = null

        await transaction(async (client) => {
            // Check if user already exists
            const existingUserRes = await client.query(
                'SELECT id FROM users WHERE world_id_nullifier = $1',
                [walletAddress]
            )

            if (existingUserRes.rows.length === 0) {
                // New user!
                let referrerRecord = null
                if (referrerAddress && typeof referrerAddress === 'string') {
                    // Try to find by referral code first
                    let referrerRes = await client.query(
                        'SELECT id, wallet_address, world_id_nullifier, username FROM users WHERE UPPER(referral_code) = UPPER($1)',
                        [referrerAddress]
                    )
                    
                    // If not found, try to find by wallet address
                    if (referrerRes.rows.length === 0) {
                        referrerRes = await client.query(
                            'SELECT id, wallet_address, world_id_nullifier, username FROM users WHERE LOWER(wallet_address) = LOWER($1)',
                            [referrerAddress]
                        )
                    }

                    if (referrerRes.rows.length > 0 && referrerRes.rows[0].world_id_nullifier !== walletAddress) {
                        referrerRecord = referrerRes.rows[0]
                    }
                }

                // Generate new user referral code
                let referralCode = ''
                let isUnique = false
                while (!isUnique) {
                    referralCode = `void-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                    const check = await client.query("SELECT id FROM users WHERE referral_code = $1", [referralCode])
                    if (check.rows.length === 0) {
                        isUnique = true
                    }
                }

                // Create new user (starting particles: 0, referred_by set, referral_reward_claimed = FALSE)
                const insertRes = await client.query(
                    `INSERT INTO users (world_id_nullifier, wallet_address, particles, total_particles_collected, last_login, referral_code, referred_by, referral_reward_claimed)
                     VALUES ($1, $1, 0, 0, NOW(), $2, $3, FALSE)
                     RETURNING id`,
                    [walletAddress, referralCode, referrerRecord ? referrerRecord.world_id_nullifier : null]
                )
                userId = insertRes.rows[0].id

                // Create user streak record to prevent database integrity constraint errors
                await client.query(
                    'INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
                    [userId]
                )

                if (referrerRecord) {
                    referralClaimed = true
                    referrerUsername = referrerRecord.username || 'znajomy'
                }
            } else {
                // Existing user
                userId = existingUserRes.rows[0].id
                await client.query(
                    `UPDATE users 
                     SET wallet_address = $1, last_login = NOW(), updated_at = NOW() 
                     WHERE world_id_nullifier = $1`,
                    [walletAddress]
                )
            }
        })

        cookieStore.delete('siwe')
        cookieStore.set('auth_address', walletAddress, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 604800
        })

        console.log('[WorldID Verify] User created/updated successfully:', userId)

        return NextResponse.json({
            success: true,
            userAddress: walletAddress,
            userId: userId,
            referralClaimed,
            referrerUsername
        })

    } catch (error: any) {
        console.error('[WorldID Verify] Unexpected error:', error)
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
