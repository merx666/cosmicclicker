import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await query(
            `SELECT value FROM app_config WHERE key = 'conversion_rate'`
        )

        if (result.rows.length === 0) {
            // Fallback if rate not set yet
            return NextResponse.json({
                particles_per_wld: 150000,
                wld_price_usd: 0.465,
                last_update: new Date().toISOString(),
                base_rate: 150000,
                target_price: 0.50
            })
        }

        return NextResponse.json(result.rows[0].value)
    } catch (error) {
        console.error('[API] Conversion rate error:', error)
        return NextResponse.json({
            error: 'Failed to fetch rate',
            // Fallback rate
            particles_per_wld: 150000,
            wld_price_usd: 0.465
        }, { status: 500 })
    }
}
