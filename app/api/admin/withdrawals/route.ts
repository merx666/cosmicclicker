import { NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'

// GET - List withdrawal requests for admin
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VoidCollector2024!' // Fallback temporarily

        if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await query(
            `SELECT wr.*, u.world_id_nullifier 
             FROM withdrawal_requests wr 
             LEFT JOIN users u ON wr.user_id = u.id 
             ORDER BY wr.created_at DESC 
             LIMIT 100`
        )

        return NextResponse.json({ withdrawals: result.rows })

    } catch (error) {
        console.error('Admin withdrawals GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }
}

// PATCH - Update withdrawal status
export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VoidCollector2024!'

        if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, status, transaction_hash, admin_note } = await request.json()

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
        }

        const validStatuses = ['pending', 'approved', 'paid', 'rejected']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        let updateQuery = 'UPDATE withdrawal_requests SET status = $1'
        const params: any[] = [status]
        let paramIndex = 2

        if (transaction_hash) {
            updateQuery += `, transaction_hash = $${paramIndex++}`
            params.push(transaction_hash)
        }

        if (admin_note) {
            updateQuery += `, admin_note = $${paramIndex++}`
            params.push(admin_note)
        }

        if (status === 'paid') {
            updateQuery += `, processed_at = NOW()`
        }

        updateQuery += ` WHERE id = $${paramIndex}`
        params.push(id)

        const rowsAffected = await execute(updateQuery, params)

        if (rowsAffected === 0) {
            return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Admin withdrawals PATCH error:', error)
        return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }
}
