import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json()
        const { itemId } = body

        if (!itemId) {
            return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
        }

        // Get user id
        const userResult = await query(
            'SELECT id FROM users WHERE wallet_address = $1',
            [address.toLowerCase()]
        )

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userId = userResult.rows[0].id

        // Check if user has the item
        const inventoryResult = await query(
            'SELECT id, quantity FROM user_inventory WHERE user_id = $1 AND item_id = $2 AND quantity > 0',
            [userId, itemId]
        )

        if (inventoryResult.rows.length === 0) {
            return NextResponse.json({ error: 'Item not found in inventory or zero quantity' }, { status: 400 })
        }

        const inventoryId = inventoryResult.rows[0].id
        const currentQty = inventoryResult.rows[0].quantity

        // Deduct item
        const newQty = currentQty - 1
        
        if (newQty === 0) {
            await query('DELETE FROM user_inventory WHERE id = $1', [inventoryId])
        } else {
            await query('UPDATE user_inventory SET quantity = $1 WHERE id = $2', [newQty, inventoryId])
        }

        return NextResponse.json({ success: true, remaining: newQty })

    } catch (error: any) {
        console.error('Consume api error:', error)
        return NextResponse.json({ error: 'Failed to consume item' }, { status: 500 })
    }
}
