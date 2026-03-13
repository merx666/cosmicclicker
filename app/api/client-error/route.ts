import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.error('=== CLIENT-SIDE ERROR REPORT ===')
        console.error('Time:', new Date().toISOString())
        console.error('User Agent:', req.headers.get('user-agent'))
        console.error('Error Data:\n', JSON.stringify(body, null, 2))
        console.error('==================================')

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to parse' }, { status: 400 })
    }
}
