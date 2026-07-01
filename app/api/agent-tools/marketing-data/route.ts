import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category') || 'all'
        
        const validCategories = ['all', 'void_block', 'referrals', 'weekly_challenges']
        if (!validCategories.includes(category)) {
            return NextResponse.json({
                error: true,
                message: `Niepoprawna kategoria: '${category}'. Dostępne kategorie to: ${validCategories.join(', ')}.`,
                suggestions: validCategories
            }, { status: 400 })
        }

        const data: Record<string, unknown> = {}

        // 1. VOID BLOCK DATA
        if (category === 'all' || category === 'void_block') {
            const activeRound = await queryOne<{ id: number; total_pool: string; end_time: Date }>(
                "SELECT id, total_pool, end_time FROM void_block_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
            )
            
            let activeRoundStats = null
            if (activeRound) {
                const betCountRes = await queryOne<{ count: number }>(
                    "SELECT COUNT(*)::int as count FROM void_block_bets WHERE round_id = $1",
                    [activeRound.id]
                )
                activeRoundStats = {
                    round_id: activeRound.id,
                    total_pool: Number(activeRound.total_pool || 0),
                    end_time: activeRound.end_time ? new Date(activeRound.end_time).toISOString() : null,
                    bets_count: Number(betCountRes?.count || 0)
                }
            }

            const latestWinner = await queryOne<{ id: number; net_pool: string; winner_username: string; winner_wallet: string }>(
                "SELECT id, net_pool, winner_username, winner_wallet FROM void_block_rounds WHERE status = 'finished' ORDER BY id DESC LIMIT 1"
            )

            let latestWinnerStats = null
            if (latestWinner) {
                const maskedWallet = latestWinner.winner_wallet 
                    ? `${latestWinner.winner_wallet.substring(0, 6)}...${latestWinner.winner_wallet.substring(latestWinner.winner_wallet.length - 4)}` 
                    : null
                
                latestWinnerStats = {
                    round_id: latestWinner.id,
                    net_pool: Number(latestWinner.net_pool || 0),
                    winner: latestWinner.winner_username 
                        ? `@${latestWinner.winner_username}` 
                        : (maskedWallet || 'Anonymous')
                }
            }

            data.void_block = {
                active_round: activeRoundStats,
                latest_winner: latestWinnerStats
            }
        }

        // 2. REFERRALS DATA
        if (category === 'all' || category === 'referrals') {
            const totalUsersRes = await queryOne<{ count: string }>(
                "SELECT COUNT(*)::text as count FROM users"
            )
            const referredUsersRes = await queryOne<{ count: string }>(
                "SELECT COUNT(*)::text as count FROM users WHERE referred_by IS NOT NULL"
            )

            data.referrals = {
                total_users: Number(totalUsersRes?.count || 0),
                total_referred_users: Number(referredUsersRes?.count || 0),
                program_info: "Zaproś znajomego za pomocą swojego kodu polecającego, a oboje otrzymacie dodatkowe Particles oraz BP XP po weryfikacji przez World ID!"
            }
        }

        // 3. WEEKLY CHALLENGES
        if (category === 'all' || category === 'weekly_challenges') {
            data.weekly_challenges = [
                {
                    id: 'weekly_collect_500k',
                    name: 'Pierz Pustkę (Particles)',
                    description: 'Zbierz 500,000 cząsteczek (Particles) w tym tygodniu.',
                    target: 500000,
                    reward: 5000
                },
                {
                    id: 'weekly_click_10k',
                    name: 'Klikacz Próżni',
                    description: 'Kliknij 10,000 razy w tym tygodniu.',
                    target: 10000,
                    reward: 3000
                },
                {
                    id: 'weekly_roulette_3',
                    name: 'Szczęście w Ruletce',
                    description: 'Wygraj w ruletce 3 razy w tym tygodniu.',
                    target: 3,
                    reward: 2500
                },
                {
                    id: 'weekly_passive_100k',
                    name: 'Pasywna Pustka',
                    description: 'Zbierz 100,000 cząsteczek pasywnie w tym tygodniu.',
                    target: 100000,
                    reward: 2000
                }
            ]
        }

        return NextResponse.json(data)
    } catch (err) {
        const error = err as Error
        return NextResponse.json({
            error: true,
            message: `Wystąpił nieoczekiwany błąd podczas pobierania danych: ${error.message}`
        }, { status: 500 })
    }
}
