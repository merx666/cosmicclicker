'use client'

import { motion } from 'framer-motion'
import {
    SwordIcon,
    SkullIcon,
    CrownIcon,
    CloseIcon
} from '@/components/UI/Icons'

interface DifficultySelectorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (difficulty: 'easy' | 'hard' | 'insane') => void
}

export default function DifficultySelectorModal({ isOpen, onClose, onSelect }: DifficultySelectorModalProps) {
    if (!isOpen) return null

    const difficulties = [
        {
            id: 'easy',
            label: 'NORMAL',
            icon: SwordIcon,
            color: 'text-green-400',
            bg: 'from-green-900/40 to-green-800/20',
            border: 'border-green-500/30',
            desc: 'Standard enemy waves. Good for practice.',
            rewards: '1.0x Rewards'
        },
        {
            id: 'hard',
            label: 'HARD',
            icon: SkullIcon,
            color: 'text-red-400',
            bg: 'from-red-900/40 to-red-800/20',
            border: 'border-red-500/30',
            desc: 'Tougher enemies. Strategic placement required.',
            rewards: '1.5x Rewards'
        },
        {
            id: 'insane',
            label: 'INSANE',
            icon: CrownIcon,
            color: 'text-purple-400',
            bg: 'from-purple-900/40 to-purple-800/20',
            border: 'border-purple-500/30',
            desc: 'For elite commanders only. Expect no mercy.',
            rewards: '2.5x Rewards + Rare Drops'
        }
    ]

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[200] p-4 h-[100dvh] overflow-y-auto overflow-x-hidden safe-area-inset-top">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative shadow-2xl my-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                    <CloseIcon size={24} />
                </button>

                <h2 className="text-2xl font-black text-center mb-1 text-white uppercase tracking-wider">
                    Select Difficulty
                </h2>
                <p className="text-center text-slate-400 text-sm mb-6">
                    Choose your challenge level
                </p>

                <div className="flex flex-col gap-3">
                    {difficulties.map((diff) => (
                        <motion.button
                            key={diff.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(diff.id as 'easy' | 'hard' | 'insane')}
                            className={`relative flex items-center p-4 rounded-xl border-2 transition-all group overflow-hidden ${diff.border} bg-gradient-to-r ${diff.bg}`}
                        >
                            <div className={`p-3 rounded-full bg-black/40 ${diff.color} mr-4`}>
                                <diff.icon size={28} />
                            </div>

                            <div className="flex-1 text-left">
                                <div className={`text-lg font-black uppercase ${diff.color}`}>
                                    {diff.label}
                                </div>
                                <div className="text-xs text-slate-300 mb-1">
                                    {diff.desc}
                                </div>
                                <div className="text-xs font-mono font-bold text-yellow-400">
                                    {diff.rewards}
                                </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
