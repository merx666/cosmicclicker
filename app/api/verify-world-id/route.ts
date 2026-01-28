import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const payload = await request.json()

        console.log('World ID verification payload:', JSON.stringify(payload, null, 2))

        // Extract wallet address from payload
        const walletAddress = payload.wallet_address || payload.address

        if (!walletAddress) {
            console.error('Missing wallet_address in payload:', payload)
            return NextResponse.json(
                { error: 'Missing wallet_address' },
                { status: 400 }
            )
        }

        console.log('Creating/updating user with wallet address:', walletAddress)

        // Create or update user in PostgreSQL
        const result = await query(
            `INSERT INTO users (world_id_nullifier, wallet_address, last_login) 
             VALUES ($1, $1, NOW()) 
             ON CONFLICT (world_id_nullifier) 
             DO UPDATE SET wallet_address = $1, last_login = NOW(), updated_at = NOW()
             RETURNING id`,
            [walletAddress]
        )

        const user = result.rows[0]

        console.log('User created/updated successfully:', user?.id)

        return NextResponse.json({
            success: true,
            userAddress: walletAddress,
            userId: user.id
        })

    } catch (error: any) {
        console.error('Verification error:', error)
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
