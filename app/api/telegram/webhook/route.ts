import { NextResponse, NextRequest } from 'next/server'
import { grantPurchase } from '@/lib/purchaseHelper'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            console.error('[Telegram Webhook] Error: TELEGRAM_BOT_TOKEN not configured')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const body = await req.json()
        
        // Log webhook payload in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Telegram Webhook] Received update:', JSON.stringify(body, null, 2))
        }

        // 1. Handle pre_checkout_query (Stars pre-check)
        if (body.pre_checkout_query) {
            const preCheckout = body.pre_checkout_query
            const preCheckoutQueryId = preCheckout.id
            const invoicePayloadStr = preCheckout.invoice_payload

            console.log(`[Telegram Webhook] Handling pre_checkout_query ${preCheckoutQueryId}`)

            try {
                const invoicePayload = JSON.parse(invoicePayloadStr)
                const userId = invoicePayload.uid || invoicePayload.userId
                const itemId = invoicePayload.item || invoicePayload.itemId

                // Verify user and item exist
                const user = await queryOne('SELECT id FROM users WHERE id = $1', [userId])
                if (!user) {
                    console.error('[Telegram Webhook] User in payload not found:', userId)
                    await answerPreCheckoutQuery(botToken, preCheckoutQueryId, false, 'User profile not found. Please reload the app.')
                    return NextResponse.json({ ok: true })
                }

                // If check passes, answer OK
                await answerPreCheckoutQuery(botToken, preCheckoutQueryId, true)
            } catch (err: any) {
                console.error('[Telegram Webhook] Error parsing pre_checkout_query payload:', err)
                await answerPreCheckoutQuery(botToken, preCheckoutQueryId, false, 'Invalid checkout details. Please try again.')
            }

            return NextResponse.json({ ok: true })
        }

        // 2. Handle successful_payment
        if (body.message?.successful_payment) {
            const payment = body.message.successful_payment
            const invoicePayloadStr = payment.invoice_payload
            const telegramPaymentChargeId = payment.telegram_payment_charge_id
            const totalAmount = payment.total_amount // Price paid in Stars (XTR)

            console.log(`[Telegram Webhook] Processing successful payment ${telegramPaymentChargeId} for ${totalAmount} Stars`)

            try {
                const invoicePayload = JSON.parse(invoicePayloadStr)
                const userId = invoicePayload.uid || invoicePayload.userId
                const itemId = invoicePayload.item || invoicePayload.itemId
                const reference = invoicePayload.ref || invoicePayload.reference

                const result = await grantPurchase(
                    userId,
                    itemId,
                    totalAmount,
                    'XTR',
                    reference || telegramPaymentChargeId
                )

                if (result.success) {
                    console.log(`[Telegram Webhook] Successfully processed purchase of ${itemId} for user ${userId}`)
                    
                    // Optionally: Send Telegram message to user confirming purchase
                    try {
                        const user = await queryOne('SELECT telegram_id FROM users WHERE id = $1', [userId])
                        if (user && user.telegram_id) {
                            await sendBotMessage(botToken, user.telegram_id, `⚡️ Thank you! Your purchase of "${itemId}" was successful. Reload the game to enjoy your upgrade!`)
                        }
                    } catch (msgErr) {
                        console.error('[Telegram Webhook] Failed to send confirmation message:', msgErr)
                    }
                } else {
                    console.error(`[Telegram Webhook] Failed to grant purchase: ${result.error}`)
                }
            } catch (err: any) {
                console.error('[Telegram Webhook] Error parsing successful_payment payload:', err)
            }

            return NextResponse.json({ ok: true })
        }

        // Default response for other updates
        return NextResponse.json({ ok: true })

    } catch (e: any) {
        console.error('[Telegram Webhook] Unexpected error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}

async function answerPreCheckoutQuery(
    botToken: string,
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pre_checkout_query_id: preCheckoutQueryId,
                ok,
                error_message: errorMessage
            })
        })
        const data = await response.json()
        if (!response.ok || !data.ok) {
            console.error('[Telegram API] Failed to answerPreCheckoutQuery:', data)
        }
    } catch (err) {
        console.error('[Telegram API] Error in answerPreCheckoutQuery:', err)
    }
}

async function sendBotMessage(botToken: string, chatId: number, text: string) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML'
            })
        })
        const data = await response.json()
        if (!response.ok || !data.ok) {
            console.error('[Telegram API] Failed to sendMessage:', data)
        }
    } catch (err) {
        console.error('[Telegram API] Error in sendMessage:', err)
    }
}
