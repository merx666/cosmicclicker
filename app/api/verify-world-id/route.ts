import { NextResponse } from 'next/server'
import type { ISuccessResult } from '@worldcoin/minikit-js'
import { query } from '@/lib/db'

/**
 * World ID 4.0 verification endpoint.
 * Uses the new /api/v4/verify/{rp_id} endpoint (accepts both V3 legacy and V4 proofs).
 * MiniKit returns V3-format proofs (proof, merkle_root, nullifier_hash).
 * We forward these as VerifyV4LegacyProofRequest (protocol_version: "3.0").
 */
export async function POST(request: Request) {
    try {
        // Check maintenance mode
        if (process.env.MAINTENANCE_MODE === 'true') {
            console.log('[WorldID Verify] Maintenance mode active, rejecting verification')
            return NextResponse.json(
                { error: 'Season 2 update in progress. Please try again later.' },
                { status: 503 }
            )
        }

        const body = await request.json()
        const { payload, action, signal, nonce } = body

        console.log('[WorldID Verify] Verification request:', { action, signal })

        const rpId = process.env.WORLD_RP_ID

        if (!rpId) {
            console.error('[WorldID Verify] WORLD_RP_ID not configured')
            return NextResponse.json(
                { error: 'WORLD_RP_ID not configured on server' },
                { status: 500 }
            )
        }

        if (!payload || !nonce) {
            console.error('[WorldID Verify] Missing payload or nonce')
            return NextResponse.json(
                { error: 'Missing payload or nonce in request body' },
                { status: 400 }
            )
        }

        const miniKitPayload = payload as ISuccessResult

        // MiniKit returns V3 legacy proofs (proof string, merkle_root, nullifier_hash)
        // Map to VerifyV4LegacyProofRequest format accepted by new /api/v4/verify/{rp_id}
        const verifyRequestBody = {
            protocol_version: '3.0',
            nonce,
            action: action || 'verify',
            environment: 'production',
            responses: [
                {
                    identifier: 'orb',
                    proof: miniKitPayload.proof,
                    merkle_root: miniKitPayload.merkle_root,
                    nullifier: miniKitPayload.nullifier_hash,
                    signal_hash: signal
                        ? `0x${Buffer.from(signal).toString('hex').padStart(64, '0')}`
                        : '0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4',
                }
            ]
        }

        console.log('[WorldID Verify] Calling World ID V4 API...')

        const verifyURL = `https://developer.world.org/api/v4/verify/${rpId}`
        const verifyResponse = await fetch(verifyURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyRequestBody),
        })

        const verifyResult = await verifyResponse.json()

        console.log('[WorldID Verify] World ID V4 API response:', verifyResult)

        if (!verifyResult.success) {
            console.error('[WorldID Verify] Verification failed:', verifyResult)
            return NextResponse.json(
                {
                    error: 'World ID proof verification failed',
                    code: verifyResult.code,
                    detail: verifyResult.detail,
                },
                { status: 400 }
            )
        }

        // Extract nullifier hash from the verified proof
        const userHash = miniKitPayload.nullifier_hash

        if (!userHash) {
            console.error('[WorldID Verify] Missing nullifier_hash in payload:', payload)
            return NextResponse.json(
                { error: 'Missing nullifier_hash from verification' },
                { status: 400 }
            )
        }

        console.log('[WorldID Verify] Creating/updating user with nullifier hash:', userHash)

        const result = await query(
            `INSERT INTO users (world_id_nullifier, last_login) 
             VALUES ($1, NOW()) 
             ON CONFLICT (world_id_nullifier) 
             DO UPDATE SET last_login = NOW(), updated_at = NOW()
             RETURNING id`,
            [userHash]
        )

        const user = result.rows[0]

        console.log('[WorldID Verify] User created/updated successfully:', user?.id)

        return NextResponse.json({
            success: true,
            userAddress: userHash,
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
