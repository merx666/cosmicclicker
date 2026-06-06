import { NextResponse, NextRequest } from 'next/server'
import { grantPurchase, PREMIUM_ITEMS } from '@/lib/purchaseHelper'
import { SHOP_CATALOG } from '@/lib/gameEconomy'
import { queryOne } from '@/lib/db'

// Fetch TON price in USD with a fallback
async function getTonPrice(): Promise<number> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 seconds timeout

        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd',
            { signal: controller.signal }
        )
        clearTimeout(timeoutId)

        if (response.ok) {
            const data = await response.json()
            const price = data['the-open-network']?.usd
            if (price && typeof price === 'number') {
                return price
            }
        }
    } catch (e) {
        console.warn('[TON Price] Failed to fetch current price, using fallback:', e)
    }
    // Fallback: 1 TON = 5.25 USD
    return 5.25
}

// Fetch transactions for the merchant address from Toncenter API
async function getTonTransactions(merchantAddress: string, isTestnet: boolean): Promise<any[]> {
    try {
        const baseUrl = isTestnet 
            ? 'https://testnet.toncenter.com/api/v2/getTransactions'
            : 'https://toncenter.com/api/v2/getTransactions'
        
        const apiKey = process.env.TONCENTER_API_KEY || ''
        const url = `${baseUrl}?address=${encodeURIComponent(merchantAddress)}&limit=50`
        
        const headers: HeadersInit = {}
        if (apiKey) {
            headers['X-API-Key'] = apiKey
        }

        const response = await fetch(url, { headers })
        if (!response.ok) {
            console.error(`[TON API] Toncenter returned status ${response.status}`)
            return []
        }

        const data = await response.json()
        if (data.ok && Array.isArray(data.result)) {
            return data.result
        }
    } catch (e) {
        console.error('[TON API] Error fetching transactions:', e)
    }
    return []
}

// Decode base64 comment helper
function decodeBase64(base64: string): string {
    try {
        return Buffer.from(base64, 'base64').toString('utf-8')
    } catch {
        return ''
    }
}

// Find comment/payload in incoming message
function getTransactionComment(inMsg: any): string {
    if (!inMsg) return ''
    
    // Check if plain text message is in message field directly
    if (typeof inMsg.message === 'string') {
        return inMsg.message.trim()
    }
    
    // Check msg_data for text/base64
    if (inMsg.msg_data) {
        const type = inMsg.msg_data['@type']
        if (type === 'msg.dataText' && typeof inMsg.msg_data.text === 'string') {
            return decodeBase64(inMsg.msg_data.text).trim()
        }
        if (type === 'msg.dataRaw' && typeof inMsg.msg_data.body === 'string') {
            return decodeBase64(inMsg.msg_data.body).trim()
        }
    }
    
    return ''
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, itemId, tonTxHash } = body

        if (!userId || !itemId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        // Resolve database UUID for users (world_id_nullifier or wallet_address match)
        const user = await queryOne(
            'SELECT id FROM users WHERE wallet_address = $1 OR world_id_nullifier = $1 OR id::text = $1',
            [userId.toLowerCase()]
        )
        if (!user) {
            console.error(`[TON Verify] User not found for userId: ${userId}`)
            return NextResponse.json({ error: 'User profile not found. Please log in again.' }, { status: 404 })
        }
        const dbUserId = user.id

        const merchantAddress = process.env.MERCHANT_TON_ADDRESS
        if (!merchantAddress) {
            console.error('[TON Verify] MERCHANT_TON_ADDRESS not configured')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const tonNetwork = process.env.TON_NETWORK || 'mainnet'
        const isTestnet = tonNetwork.toLowerCase() === 'testnet'

        // 1. If transaction hash is provided, check if already processed
        if (tonTxHash) {
            const existingPurchase = await queryOne(
                'SELECT id FROM purchases WHERE transaction_hash = $1',
                [tonTxHash]
            )
            if (existingPurchase) {
                return NextResponse.json({
                    success: true,
                    alreadyProcessed: true,
                    message: 'Transaction already processed successfully.'
                })
            }
        }

        // 2. Fetch item from catalog
        const item = SHOP_CATALOG.find(i => i.id === itemId) || PREMIUM_ITEMS.find(i => i.id === itemId)
        if (!item) {
            return NextResponse.json({ error: 'Item not found in catalog' }, { status: 404 })
        }

        // 3. Fetch latest transactions on merchant address
        console.log(`[TON Verify] Fetching TON transactions for merchant ${merchantAddress} on ${tonNetwork}...`)
        const transactions = await getTonTransactions(merchantAddress, isTestnet)
        
        if (transactions.length === 0) {
            return NextResponse.json({ error: 'No recent transactions found on blockchain.' }, { status: 404 })
        }

        // 4. Find the transaction matching the provided hash OR matching comment (if hash not provided)
        const expectedComment = `VC-${userId}-${itemId}`
        let tx: any = null
        let matchedHashHex = ''

        if (tonTxHash) {
            const targetHashHex = tonTxHash.toLowerCase()
            tx = transactions.find(t => {
                const hash = t.transaction_id?.hash || ''
                let hashHex = hash.toLowerCase()
                if (hash.length === 44 && hash.endsWith('=')) {
                    try {
                        hashHex = Buffer.from(hash, 'base64').toString('hex').toLowerCase()
                    } catch {}
                }
                return hashHex === targetHashHex
            })
            matchedHashHex = targetHashHex
        } else {
            // Find by matching comment
            console.log(`[TON Verify] No Tx Hash provided. Scanning recent transactions for comment: "${expectedComment}"`)
            
            // Filter transactions that have the correct comment
            const candidates = []
            for (const t of transactions) {
                const comment = getTransactionComment(t.in_msg)
                if (comment === expectedComment) {
                    candidates.push(t)
                }
            }

            // Find one whose hash is not yet processed in the database
            for (const candidate of candidates) {
                const hash = candidate.transaction_id?.hash || ''
                let hashHex = hash.toLowerCase()
                if (hash.length === 44 && hash.endsWith('=')) {
                    try {
                        hashHex = Buffer.from(hash, 'base64').toString('hex').toLowerCase()
                    } catch {}
                }

                const alreadyUsed = await queryOne(
                    'SELECT id FROM purchases WHERE transaction_hash = $1',
                    [hashHex]
                )

                if (!alreadyUsed) {
                    tx = candidate
                    matchedHashHex = hashHex
                    break
                }
            }
        }

        if (!tx) {
            return NextResponse.json({ 
                error: 'Transaction not found on the blockchain yet. Please wait a few seconds and try again.' 
            }, { status: 404 })
        }

        // 5. Verify transaction details
        const inMsg = tx.in_msg
        if (!inMsg) {
            return NextResponse.json({ error: 'Transaction is invalid (no incoming message).' }, { status: 400 })
        }

        // Check value (nanoTON)
        const valueNano = parseInt(inMsg.value || '0', 10)
        if (valueNano <= 0) {
            return NextResponse.json({ error: 'Transaction has no value.' }, { status: 400 })
        }

        // Calculate expected price in TON
        const tonPriceUsd = await getTonPrice()
        const expectedPriceTon = item.price / tonPriceUsd
        const expectedPriceNano = expectedPriceTon * 1e9

        // Allow 5% tolerance for rate fluctuations
        const minPriceNano = expectedPriceNano * 0.95

        console.log(`[TON Verify] Item price: $${item.price}. TON Price: $${tonPriceUsd}. Expected: ${expectedPriceTon} TON (${expectedPriceNano} nanoTON). Received: ${valueNano / 1e9} TON (${valueNano} nanoTON)`)

        if (valueNano < minPriceNano) {
            return NextResponse.json({ 
                error: `Transaction value (${valueNano / 1e9} TON) is less than the required amount (${expectedPriceTon.toFixed(4)} TON).` 
            }, { status: 400 })
        }

        // Verify transaction comment / payload
        const comment = getTransactionComment(inMsg)
        
        console.log(`[TON Verify] Transaction comment: "${comment}". Expected: "${expectedComment}"`)
        
        // Match expected comment (supporting partial match if needed, but exact is safer)
        if (comment !== expectedComment) {
            return NextResponse.json({ 
                error: `Transaction comment ("${comment}") does not match the expected payload.` 
            }, { status: 400 })
        }

        // 6. Grant purchase
        const pricePaidTon = valueNano / 1e9
        const result = await grantPurchase(
            dbUserId,
            itemId,
            pricePaidTon,
            'TON',
            matchedHashHex
        )

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to grant purchase.' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            item: result.item
        })

    } catch (e: any) {
        console.error('[TON Verify] Unexpected error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        merchantAddress: process.env.MERCHANT_TON_ADDRESS || ''
    })
}
