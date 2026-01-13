import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const today = new Date().toISOString().split('T')[0]

        // Fetch today's stats
        const { data, error } = await supabase
            .from('daily_conversions')
            .select('*')
            .eq('conversion_date', today)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        const totalClaimed = data?.total_wld_claimed || 0
        const MAX_DAILY_WLD = 100

        return NextResponse.json({
            date: today,
            totalClaimed: Number(totalClaimed),
            conversions: data?.conversion_count || 0,
            limitReached: totalClaimed >= MAX_DAILY_WLD,
            remaining: Math.max(0, MAX_DAILY_WLD - Number(totalClaimed)),
            maxDaily: MAX_DAILY_WLD
        })
    } catch (error) {
        console.error('[Daily Stats] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch daily stats' },
            { status: 500 }
        )
    }
}
