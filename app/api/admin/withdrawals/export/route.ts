import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Export withdrawals as CSV
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

        if (!ADMIN_PASSWORD) {
            console.error('ADMIN_PASSWORD environment variable is not set')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let sql = `SELECT wr.id, wr.wallet_address, wr.wld_amount, wr.status, 
                          wr.transaction_hash, wr.created_at, wr.processed_at,
                          u.world_id_nullifier
                   FROM withdrawal_requests wr 
                   LEFT JOIN users u ON wr.user_id = u.id`

        const params: any[] = []
        if (status) {
            sql += ' WHERE wr.status = $1'
            params.push(status)
        }

        sql += ' ORDER BY wr.created_at DESC'

        const result = await query(sql, params)

        // Generate CSV
        const headers = ['id', 'wallet_address', 'wld_amount', 'status', 'transaction_hash', 'created_at', 'processed_at']
        const csv = [
            headers.join(','),
            ...result.rows.map((row: any) =>
                headers.map(h => `"${row[h] || ''}"`).join(',')
            )
        ].join('\n')

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="withdrawals-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })

    } catch (error) {
        console.error('Export withdrawals error:', error)
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
    }
}
