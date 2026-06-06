import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'

interface IRequestPayload {
    payload: MiniAppWalletAuthSuccessPayload
    nonce: string
}

export async function POST(req: NextRequest) {
    try {
        const { payload, nonce } = await req.json() as IRequestPayload

        console.log("🔵 Verifying wallet auth - Status:", payload.status)

        const jar = await cookies()
        const storedNonce = jar.get('siwe')?.value

        if (nonce !== storedNonce) {
            console.error("❌ Nonce mismatch")
            return NextResponse.json({
                success: false,
                isValid: false,
                error: "Invalid nonce"
            }, { status: 401 })
        }

        try {
            const validMessage = await verifySiweMessage(payload, nonce)

            if (!validMessage.isValid) {
                console.error("❌ Invalid signature")
                return NextResponse.json({
                    success: false,
                    isValid: false,
                    error: "Invalid signature"
                }, { status: 401 })
            }

            jar.delete('siwe')
            jar.set('auth_address', payload.address, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 604800
            })

            console.log("✅ Auth successful:", payload.address)

            return NextResponse.json({
                success: true,
                isValid: true,
                user: { address: payload.address }
            })

        } catch (verifyError: any) {
            console.error("❌ Verify failed:", verifyError)
            return NextResponse.json({
                success: false,
                isValid: false,
                error: verifyError.message || "Verification failed"
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error("❌ Error:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Internal error"
        }, { status: 500 })
    }
}
