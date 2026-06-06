import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    try {
        const nonce: string = crypto.randomUUID().replace(/-/g, '')

        const jar = await cookies()
        jar.set('siwe', nonce, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 900
        })

        return NextResponse.json({ nonce })
    } catch (error: any) {
        console.error("Error generating nonce:", error)
        return NextResponse.json(
            { error: "Failed to generate nonce" },
            { status: 500 }
        )
    }
}
