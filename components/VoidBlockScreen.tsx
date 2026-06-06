'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import VoidBlockTab from './tabs/VoidBlockTab'

interface VoidBlockScreenProps {
    onBackToMenu: () => void
}

export default function VoidBlockScreen({ onBackToMenu }: VoidBlockScreenProps) {
    return (
        <div className="min-h-screen bg-[#05020c] flex flex-col text-white font-sans overflow-y-auto pb-12 select-none relative pt-[env(safe-area-inset-top)] px-4">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Pulsing radial glow top */}
                <motion.div
                    className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-950/20 blur-[120px]"
                    animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Pulsing radial glow bottom */}
                <motion.div
                    className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-950/20 blur-[120px]"
                    animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.08, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Header HUD */}
            <motion.header
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-auto flex justify-between items-center py-4 border-b border-purple-500/15 mb-4"
            >
                <motion.button
                    onClick={onBackToMenu}
                    whileTap={{ scale: 0.92 }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/30 border border-purple-500/25 text-purple-400 font-bold text-[10px] uppercase tracking-wider hover:border-purple-500/50 hover:bg-purple-950/50 transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> MENU
                </motion.button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                    </motion.div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-300">VOID JACKPOT</span>
                </div>
            </motion.header>

            {/* Main Content */}
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-10 w-full max-w-md mx-auto flex flex-col flex-1"
            >
                <VoidBlockTab />
            </motion.main>
        </div>
    )
}
