import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST() {
    const id = randomUUID()
    return NextResponse.json({ id })
}
