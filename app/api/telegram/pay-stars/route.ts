import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const jar = await cookies()
        const address = jar.get('auth_address')?.value

        if (!address) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const user = await queryOne('SELECT id, telegram_id FROM users WHERE wallet_address = $1', [address.toLowerCase()])
        if (!user || !user.telegram_id) {
            return NextResponse.json({ error: 'User profile or Telegram ID not found' }, { status: 404 })
        }

        const body = await req.json()
        const { itemId, priceStars, title, description, reference } = body

        if (!itemId || !priceStars) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            return NextResponse.json({ error: 'Server configuration error (missing token)' }, { status: 500 })
        }

        const payload = JSON.stringify({
            uid: user.id,
            item: itemId,
            ref: reference ? reference.slice(0, 30) : `r_${Date.now()}`
        })

        // Call Telegram Bot API createInvoiceLink
        const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title || 'Void Upgrade',
                description: description || `Purchase ${itemId} in Void Collector`,
                payload: payload,
                provider_token: '', // Empty for Telegram Stars
                currency: 'XTR', // Stars currency code
                prices: [
                    {
                        label: title || itemId,
                        amount: parseInt(priceStars, 10)
                    }
                ]
            })
        })

        const data = await response.json()

        if (!response.ok || !data.ok) {
            console.error('[Stars API] Failed to create invoice:', data)
            return NextResponse.json({ error: data.description || 'Failed to create payment invoice' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            invoiceLink: data.result
        })

    } catch (e: any) {
        console.error('[Stars API] Error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
