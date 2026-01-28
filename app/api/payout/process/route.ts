import { NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { transferWLD, getHotWalletBalance, getHotWalletAddress, PAYOUT_LIMITS } from '@/lib/payout'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VoidCollector2024!'
const MAX_SINGLE_PAYOUT = PAYOUT_LIMITS.maxSinglePayout
const MAX_DAILY_TOTAL = PAYOUT_LIMITS.maxDailyTotal // Now 10.0 from lib
const MIN_HOT_WALLET_BALANCE = 0.1 // Minimum balance to keep in hot wallet

// POST - Process pending payouts
export async function POST(request: Request) {
    try {
        // Verify admin authorization
        const authHeader = request.headers.get('authorization')
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

            // Skip if exceeds single payout limit or remaining budget
            if (amount > MAX_SINGLE_PAYOUT || amount > remainingDailyBudget) {
                results.push({
                    id: withdrawal.id,
                    status: 'skipped',
                    reason: amount > MAX_SINGLE_PAYOUT ? 'exceeds_single_limit' : 'exceeds_daily_budget'
                })
                continue
            }

            const walletAddress = withdrawal.user_wallet || withdrawal.wallet_address

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
