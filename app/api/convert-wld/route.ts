import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    try {
        const { nullifier_hash, wld_amount } = await request.json()

        if (!nullifier_hash || !wld_amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const today = new Date().toISOString().split('T')[0]
        const MAX_DAILY_WLD = 100

        // 1. Check daily limit
        const { data: stats } = await supabase
            .from('daily_conversions')
            .select('total_wld_claimed')
            .eq('conversion_date', today)
            .single()

        const currentTotal = Number(stats?.total_wld_claimed || 0)

        if (currentTotal + wld_amount > MAX_DAILY_WLD) {
            return NextResponse.json(
                {
                    error: 'Daily limit reached',
                    message: `Global daily limit of ${MAX_DAILY_WLD} WLD reached. Try again tomorrow!`,
                    currentTotal,
                    maxDaily: MAX_DAILY_WLD
                },
                { status: 429 }
            )
        }

        // 2. Update daily stats atomically
        const { error: incrementError } = await supabase.rpc('increment_daily_wld', {
            p_amount: wld_amount,
            p_date: today
        })

        if (incrementError) {
            throw incrementError
        }

        // 3. Update user's last claim time
        const { error: updateError } = await supabase
            .from('users')
            .update({ last_claim_time: Date.now() })
            .eq('world_id_nullifier', nullifier_hash)

        if (updateError) {
            console.error('[Convert WLD] Failed to update user claim time:', updateError)
        }

        return NextResponse.json({
            success: true,
            wld_claimed: wld_amount,
            new_total: currentTotal + wld_amount,
            remaining: MAX_DAILY_WLD - (currentTotal + wld_amount)
        })
    } catch (error) {
        console.error('[Convert WLD] Error:', error)
        return NextResponse.json(
            { error: 'Conversion failed' },
            { status: 500 }
        )
    }
}
