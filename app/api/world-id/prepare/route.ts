import { NextRequest, NextResponse } from 'next/server'
import { signRequest } from '@worldcoin/idkit-core/signing'

/**
 * Endpoint to prepare a signed request for World ID 4.0 Verification.
 * Generates a nonce + RP signature that binds the verification request to our RP.
 * Returns rp_id along with the signed context.
 */
export async function GET(req: NextRequest) {
    try {
        const action = req.nextUrl.searchParams.get('action') || 'verify'
        const privateKey = process.env.RP_SIGNING_KEY

        if (!privateKey) {
            console.error('[WorldID Prepare] RP_SIGNING_KEY not found in environment variables')
            return NextResponse.json({
                error: 'RP_SIGNING_KEY not configured on server'
            }, { status: 500 })
        }

        const rpId = process.env.WORLD_RP_ID

        if (!rpId) {
            console.error('[WorldID Prepare] WORLD_RP_ID not found in environment variables')
            return NextResponse.json({
                error: 'WORLD_RP_ID not configured on server'
            }, { status: 500 })
        }

        console.log(`[WorldID Prepare] Generating signature for action: ${action}, rp_id: ${rpId}`)

        // signRequest returns { sig, nonce, createdAt, expiresAt }
        const rpSignature = signRequest(action, privateKey as `0x${string}`)

        return NextResponse.json({
            rp_id: rpId,
            nonce: rpSignature.nonce,
            created_at: rpSignature.createdAt,
            expires_at: rpSignature.expiresAt,
            signature: rpSignature.sig,
        })

    } catch (error: any) {
        console.error('[WorldID Prepare] Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to prepare World ID request'
        }, { status: 500 })
    }
}
