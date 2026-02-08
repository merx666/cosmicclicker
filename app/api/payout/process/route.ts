import { NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { transferWLD, getHotWalletBalance, getHotWalletAddress, PAYOUT_LIMITS } from '@/lib/payout'

const MAX_SINGLE_PAYOUT = PAYOUT_LIMITS.maxSinglePayout
const MAX_DAILY_TOTAL = PAYOUT_LIMITS.maxDailyTotal // Now 10.0 from lib
const MIN_HOT_WALLET_BALANCE = 0.1 // Minimum balance to keep in hot wallet

// SECURITY: Banned exploiter wallets - their payouts will be rejected
const BANNED_WALLETS = [
    '0xbfab37c6703e853944696dc9400be77f3878df7b',
    '0x6109446d72bc62e2fda20bc04aa799cd6cff763c',
    '0x947fdf4a44d0440b6d67de370193875deac10ba0',
    '0x53670ca56dd6d0a0d991ff0be2b4af24643d1532'
]

// POST - Process pending payouts
export async function POST(request: Request) {
    try {
        // Verify admin authorization
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

        if (!ADMIN_PASSWORD) {
            console.error('ADMIN_PASSWORD environment variable is not set')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get pending withdrawals
        const result = await query(
            `SELECT wr.*, u.wallet_address as user_wallet 
             FROM withdrawal_requests wr 
             LEFT JOIN users u ON wr.user_id = u.id 
             WHERE wr.status = 'pending' 
             ORDER BY wr.created_at ASC 
             LIMIT 10`
        )

        const withdrawals = result.rows

        if (withdrawals.length === 0) {
            return NextResponse.json({
                message: 'No pending withdrawals',
                processed: 0
            })
        }

        // Check hot wallet balance
        const balance = await getHotWalletBalance()

        if (balance < MIN_HOT_WALLET_BALANCE) {
            return NextResponse.json({
                error: 'Hot wallet balance too low',
                balance,
                minRequired: MIN_HOT_WALLET_BALANCE
            }, { status: 503 })
        }

        // Calculate today's already paid amount
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayPaid = await queryOne<{ total: string }>(
            `SELECT COALESCE(SUM(wld_amount), 0) as total 
             FROM withdrawal_requests 
             WHERE status = 'paid' AND processed_at >= $1`,
            [todayStart.toISOString()]
        )

        const todayPaidTotal = Number(todayPaid?.total || 0)

        if (todayPaidTotal >= MAX_DAILY_TOTAL) {
            return NextResponse.json({
                error: 'Daily payout limit reached',
                todayPaid: todayPaidTotal,
                maxDaily: MAX_DAILY_TOTAL
            }, { status: 429 })
        }

        let remainingDailyBudget = MAX_DAILY_TOTAL - todayPaidTotal
        const results: any[] = []

        // Process each withdrawal
        for (const withdrawal of withdrawals) {
            const amount = Number(withdrawal.wld_amount)


            const walletAddress = withdrawal.user_wallet || withdrawal.wallet_address

            // SECURITY: Reject payouts to banned wallets
            if (BANNED_WALLETS.includes(walletAddress?.toLowerCase())) {
                await execute(
                    `UPDATE withdrawal_requests 
                     SET status = 'rejected', admin_note = 'Account banned for exploitation' 
                     WHERE id = $1`,
                    [withdrawal.id]
                )

                results.push({
                    id: withdrawal.id,
                    status: 'rejected',
                    reason: 'banned_wallet'
                })
                continue
            }

            // Skip if exceeds single payout limit or remaining budget
            if (amount > MAX_SINGLE_PAYOUT || amount > remainingDailyBudget) {
                results.push({
                    id: withdrawal.id,
                    status: 'skipped',
                    reason: amount > MAX_SINGLE_PAYOUT ? 'exceeds_single_limit' : 'exceeds_daily_budget'
                })
                continue
            }

            try {
                // Process the payout using transferWLD
                const txResult = await transferWLD(walletAddress, amount)

                if (txResult.success && txResult.hash) {
                    // Update withdrawal status in DB
                    await execute(
                        `UPDATE withdrawal_requests 
                         SET status = 'paid', transaction_hash = $1, processed_at = NOW() 
                         WHERE id = $2`,
                        [txResult.hash, withdrawal.id]
                    )

                    results.push({
                        id: withdrawal.id,
                        status: 'paid',
                        txHash: txResult.hash,
                        amount
                    })

                    remainingDailyBudget -= amount
                } else {
                    // Mark as failed
                    await execute(
                        `UPDATE withdrawal_requests 
                         SET admin_note = $1 
                         WHERE id = $2`,
                        [`Payout failed: ${txResult.error || 'Unknown error'}`, withdrawal.id]
                    )

                    results.push({
                        id: withdrawal.id,
                        status: 'failed',
                        error: txResult.error || 'Unknown error'
                    })
                }
            } catch (err: any) {
                results.push({
                    id: withdrawal.id,
                    status: 'error',
                    error: err.message
                })
            }
        }

        const successCount = results.filter(r => r.status === 'paid').length

        return NextResponse.json({
            processed: withdrawals.length,
            successful: successCount,
            results,
            remainingDailyBudget
        })

    } catch (error: any) {
        console.error('[Payout] Processing error:', error)
        return NextResponse.json({
            error: 'Payout processing failed',
            details: error.message
        }, { status: 500 })
    }
}

// GET - Get payout status
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

        if (!ADMIN_PASSWORD) {
            console.error('ADMIN_PASSWORD environment variable is not set')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const hotWalletAddress = process.env.HOT_WALLET_PRIVATE_KEY ?
            '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817' : null

        // Get pending count
        const pending = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = 'pending'`
        )

        // Get today's paid total
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayPaid = await queryOne<{ total: string }>(
            `SELECT COALESCE(SUM(wld_amount), 0) as total 
             FROM withdrawal_requests 
             WHERE status = 'paid' AND processed_at >= $1`,
            [todayStart.toISOString()]
        )

        let balance = 0
        try {
            balance = await getHotWalletBalance()
        } catch (e) {
            // Hot wallet not configured
        }

        return NextResponse.json({
            configured: !!process.env.HOT_WALLET_PRIVATE_KEY,
            hotWalletAddress,
            hotWalletBalance: balance,
            pendingCount: Number(pending?.count || 0),
            todayPaidTotal: Number(todayPaid?.total || 0),
            limits: {
                maxSinglePayout: MAX_SINGLE_PAYOUT,
                maxDailyTotal: MAX_DAILY_TOTAL,
                minBalance: MIN_HOT_WALLET_BALANCE
            }
        })

    } catch (error: any) {
        console.error('[Payout] Status error:', error)
        return NextResponse.json({
            error: 'Failed to get status',
            details: error.message
        }, { status: 500 })
    }
}
