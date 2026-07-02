import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { packageId, nullifierHash } = body

        if (!packageId || !nullifierHash) {
            return NextResponse.json({ error: 'Missing packageId or nullifierHash' }, { status: 400 })
        }

        const id = uuidv4()
        const amount = getPackagePrice(packageId)

        if (amount <= 0) {
            return NextResponse.json({ error: 'Invalid packageId' }, { status: 400 })
        }

        // Store transaction attempt
        await query(
            `INSERT INTO minikit_transactions (id, user_nullifier, amount, package_id, status) VALUES ($1, $2, $3, $4, 'pending')`,
            [id, nullifierHash, amount, packageId]
        )

        return NextResponse.json({ id })

    } catch (error: any) {
        console.error('Error generating nonce:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function getPackagePrice(packageId: string): number {
    switch (packageId) {
        case 'boost_1h': return 0.2
        case 'overdrive_12h': return 1
        case 'void_master_7d': return 5
        case 'singularity_perm': return 10
        default: return 0
    }
}
