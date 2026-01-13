import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service key for admin access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
)

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

        // Create or update user in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .upsert({
                world_id_nullifier: walletAddress,
                last_login: new Date().toISOString()
            }, {
                onConflict: 'world_id_nullifier'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            return NextResponse.json(
                { error: 'Database error', details: error.message },
                { status: 500 }
            )
        }

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
