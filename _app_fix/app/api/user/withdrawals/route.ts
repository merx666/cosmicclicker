import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// GET - Get user's withdrawals
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const nullifierHash = searchParams.get('nullifier_hash')

        if (!nullifierHash) {
            return NextResponse.json({ error: 'Missing nullifier_hash' }, { status: 400 })
        }

        // Get user first
        const user = await queryOne<{ id: string }>(
            'SELECT id FROM users WHERE world_id_nullifier = $1',
            [nullifierHash]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get withdrawals
        const result = await query(
            `SELECT id, wld_amount, status, transaction_hash, created_at, processed_at 
             FROM withdrawal_requests 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [user.id]
        )

        return NextResponse.json({ withdrawals: result.rows })

    } catch (error) {
        console.error('User withdrawals error:', error)
        return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }
}
