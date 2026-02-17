import { NextResponse } from 'next/server'
import { GameService } from '@/lib/services/gameService'

// GET - Load game state
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hash = searchParams.get('hash')

        if (!hash) {
            return NextResponse.json({ error: 'Missing hash parameter' }, { status: 400 })
        }

        const result = await GameService.getGameState(hash)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.statusCode })
        }

        return NextResponse.json(result.data)

    } catch (error: any) {
        console.error('GET game-state error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

        const result = await GameService.saveGameState(nullifier_hash, gameData)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.statusCode })
        }

        return NextResponse.json(result.data)

    } catch (error: any) {
        console.error('POST game-state error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
