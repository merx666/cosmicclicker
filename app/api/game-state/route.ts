import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
)

// GET - Load game state
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hash = searchParams.get('hash')

        if (!hash) {
            return NextResponse.json({ error: 'Missing hash parameter' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('world_id_nullifier', hash)
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('GET game-state error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Save game state
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nullifier_hash, ...gameData } = body

        if (!nullifier_hash) {
            return NextResponse.json({ error: 'Missing nullifier_hash' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('users')
            .update(gameData)
            .eq('world_id_nullifier', nullifier_hash)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('POST game-state error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
