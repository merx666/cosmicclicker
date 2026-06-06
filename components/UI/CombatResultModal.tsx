'use client'

import { X, Trophy, Skull, Zap } from 'lucide-react'

interface CombatResultModalProps {
    isOpen: boolean
    onClose: () => void
    victory: boolean
    wave: number
    creditsEarned: number
    stats: {
        damageDealt: number
        unitsLost: number
        enemiesKilled: number
    }
    onNextWave: () => void
    onRetry: () => void
}

export default function CombatResultModal({
    isOpen,
    onClose,
    victory,
    wave,
    creditsEarned,
    stats,
    onNextWave,
    onRetry
}: CombatResultModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className={`glass-panel w-full max-w-md border-4 rounded-2xl overflow-hidden ${victory
                ? 'border-neon-green shadow-[0_0_60px_rgba(10,255,0,0.6)]'
                : 'border-red-500 shadow-[0_0_60px_rgba(255,0,0,0.6)]'
                }`}>
                {/* Header */}
                <div className={`p-8 text-center ${victory ? 'bg-neon-green/10' : 'bg-red-500/10'}`}>
                    <div className="flex justify-center mb-4">
                        {victory ? (
                            <div className="w-24 h-24 rounded-full bg-neon-green/20 border-4 border-neon-green flex items-center justify-center animate-pulse">
                                <Trophy size={48} className="text-neon-green" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
                                <Skull size={48} className="text-red-500" />
                            </div>
                        )}
                    </div>

                    <h2 className={`text-4xl font-cyber font-bold mb-2 ${victory ? 'text-neon-green' : 'text-red-500'}`}>
                        {victory ? 'VICTORY' : 'DEFEAT'}
                    </h2>
                    <p className="text-gray-400">Wave {wave} {victory ? 'Complete' : 'Failed'}</p>
                </div>

                {/* Stats */}
                <div className="p-6 space-y-4">
                    {victory && (
                        <div className="glass-panel p-4 border-neon-green/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap size={20} className="text-neon-green" />
                                    <span className="text-gray-300">Credits Earned</span>
                                </div>
                                <span className="text-2xl font-cyber text-neon-green">+{creditsEarned}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="glass-panel p-3">
                            <div className="text-2xl font-cyber text-white">{stats.damageDealt}</div>
                            <div className="text-xs text-gray-500 mt-1">Damage</div>
                        </div>
                        <div className="glass-panel p-3">
                            <div className="text-2xl font-cyber text-white">{stats.enemiesKilled}</div>
                            <div className="text-xs text-gray-500 mt-1">Enemies</div>
                        </div>
                        <div className="glass-panel p-3">
                            <div className="text-2xl font-cyber text-white">{stats.unitsLost}</div>
                            <div className="text-xs text-gray-500 mt-1">Lost</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    {victory ? (
                        <>
                            <button
                                onClick={onNextWave}
                                className="flex-1 bg-neon-green/20 border-2 border-neon-green text-neon-green py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-neon-green/30 hover:shadow-[0_0_20px_rgba(10,255,0,0.4)] transition-all"
                            >
                                NEXT WAVE
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 glass-button border-white/30 text-white hover:bg-white/10"
                            >
                                <X size={24} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onRetry}
                                className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-500 py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all"
                            >
                                RETRY WAVE
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 glass-button border-white/30 text-white hover:bg-white/10"
                            >
                                <X size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
