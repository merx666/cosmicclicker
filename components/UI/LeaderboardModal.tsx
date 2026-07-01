import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderboardModalProps {
    isOpen: boolean
    onClose: () => void
    data: any
    type: 'wave' | 'spending' | 'streak' | 'voidbastion'
    onChangeType: (type: 'wave' | 'spending' | 'streak' | 'voidbastion') => void
}

export default function LeaderboardModal({
    isOpen,
    onClose,
    data,
    type,
    onChangeType
}: LeaderboardModalProps) {
    const { t } = useTranslation()

    const tabs = [
        { id: 'wave', label: 'Waves', icon: '🌊' },
        { id: 'spending', label: 'Spenders', icon: '💰' },
        { id: 'streak', label: 'Streak', icon: '🔥' },
        { id: 'voidbastion', label: 'Void Bastion', icon: '🏰' }
    ]

    const medals = ['🥇', '🥈', '🥉']

    const getValue = (entry: any) => {
        if (type === 'wave') return entry.highest_wave || entry.value || 0
        if (type === 'spending') return entry.total_spent_wld || entry.total_spending || entry.value || 0
        if (type === 'streak') return entry.current_streak || entry.value || 0
        if (type === 'voidbastion') return entry.highest_wave || entry.value || 0
        return 0
    }

    const getUnit = () => {
        if (type === 'spending') return ' WLD'
        if (type === 'streak') return 'd'
        if (type === 'voidbastion') return ' wave'
        return ''
    }

    const getTextColorClass = () => {
        if (type === 'wave') return 'text-cyan-400'
        if (type === 'spending') return 'text-amber-400'
        if (type === 'streak') return 'text-orange-400'
        if (type === 'voidbastion') return 'text-purple-400'
        return 'text-purple-300'
    }

    const leaderboardData = data?.leaderboard || data || []

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-[#05030f]/95 backdrop-blur-lg z-[100] flex items-center justify-center p-3"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="w-full max-w-[430px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-[#0a0415]/98 to-[#0f081e]/98 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-amber-500/15 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent uppercase">
                                    🏆 Ranking
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 text-lg flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onChangeType(tab.id as any)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors flex-shrink-0 ${
                                            type === tab.id
                                                ? 'border border-amber-500/30 bg-amber-500/15 text-amber-400'
                                                : 'border border-white/10 bg-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {!leaderboardData || leaderboardData.length === 0 ? (
                                <div className="text-center py-12 px-5">
                                    <div className="text-5xl mb-4">📊</div>
                                    <p className="text-base font-bold text-gray-500 mb-1.5">
                                        No data yet
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Be the first to climb the ranks!
                                    </p>
                                </div>
                            ) : (
                                leaderboardData.map((entry: any, index: number) => {
                                    const isTop3 = index < 3

                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                                                isTop3
                                                    ? 'bg-amber-500/5 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.03)]'
                                                    : 'bg-purple-500/5 border-purple-500/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`text-center font-black ${
                                                    isTop3 ? 'text-xl' : 'text-xs text-gray-500'
                                                } min-w-[32px]`}>
                                                    {isTop3 ? medals[index] : `#${index + 1}`}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-purple-100 font-mono">
                                                        {entry.wallet_address || '0x...'}
                                                    </div>
                                                    {(entry.total_games_played || entry.games_played) && (
                                                        <div className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">
                                                            {entry.total_games_played || entry.games_played} games
                                                            {type === 'voidbastion' && entry.total_score ? ` · ${entry.total_score} pts` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`text-lg font-black ${getTextColorClass()} text-right`}>
                                                {getValue(entry)}
                                                <span className="text-[10px] text-gray-500 font-bold ml-0.5 lowercase">
                                                    {getUnit()}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-white/5 bg-black/20 text-center">
                            <p className="text-[10px] text-gray-500">
                                Season 3 Rankings
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
