'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Play, Compass, ShieldAlert, Cpu, Sparkles, Gift, TrendingUp, Trophy } from 'lucide-react'

interface SelectionMenuScreenProps {
    username: string
    particles: number
    onSelectGame: (game: 'collector' | 'bastion' | 'wheel' | 'predictions' | 'void_block') => void
}

export default function SelectionMenuScreen({
    username,
    particles,
    onSelectGame
}: SelectionMenuScreenProps) {
    const [bastionStats, setBastionStats] = useState<{ highestWave: number; totalCredits: number } | null>(null)
    const [voidBlockPool, setVoidBlockPool] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showRefModal, setShowRefModal] = useState(false)
    const [referrerName, setReferrerName] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const claimed = window.sessionStorage.getItem('referral_claimed')
            if (claimed === 'true') {
                setShowRefModal(true)
                setReferrerName(window.sessionStorage.getItem('referrer_username') || '')
                window.sessionStorage.removeItem('referral_claimed')
                window.sessionStorage.removeItem('referrer_username')
            }
        }
    }, [])

    useEffect(() => {
        async function fetchProfiles() {
            try {
                const res = await fetch('/api/user/profile')
                if (res.ok) {
                    const data = await res.json()
                    setBastionStats({
                        highestWave: data?.user?.highestWave || 0,
                        totalCredits: data?.user?.totalCredits || 0
                    })
                }
            } catch (e) {
                console.error('Failed to fetch Void Bastion stats:', e)
            }

            try {
                const resBlock = await fetch('/api/void-block/state')
                if (resBlock.ok) {
                    const data = await resBlock.json()
                    setVoidBlockPool(data?.round?.total_pool || 0)
                }
            } catch (e) {
                console.error('Failed to fetch Void Block pool:', e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfiles()
    }, [])

    const formatNumber = (num: number) => {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
        return num.toString()
    }

    // Stagger containers and item definitions
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: 'spring' as const,
                damping: 20,
                stiffness: 100
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#05020c] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans select-none">
            {/* Background glowing rings */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-950/15 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-950/15 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

            {/* Custom moving grid background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md flex justify-between items-center z-10 py-4 border-b border-white/5"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Cpu className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">PILOT PROFILE</p>
                        <h1 className="text-sm font-extrabold text-white/90 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            {username || 'Anonymous Officer'}
                        </h1>
                    </div>
                </div>
                
                {/* Visual indicator of energy/particles */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-[11px] font-black text-purple-300 tracking-wider">ONLINE</span>
                </div>
            </motion.header>

            {/* Main Selection Area */}
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-md flex-1 flex flex-col justify-center gap-6 z-10 py-8"
            >
                <motion.div variants={itemVariants} className="text-center mb-2">
                    <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-200 to-indigo-400">
                        CHOOSE YOUR MISSION
                    </h2>
                    <p className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">
                        Enter the cosmic void simulator
                    </p>
                </motion.div>

                {/* GAME CARD 1: Void Collector */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectGame('collector')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#13072b] via-[#0b041a] to-[#04010a] p-6 shadow-[0_8px_32px_0_rgba(139,92,246,0.08)] transition-all duration-300 hover:border-purple-500/60 hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] mr-6"
                >
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />

                    {/* Hover Glow Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(169,85,247,0.22),rgba(0,0,0,0))] transition-all duration-500 group-hover:scale-110" />
                    
                    {/* Floating Icon */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 p-3 text-purple-400/20 group-hover:text-purple-400/50 transition-colors"
                    >
                        <Compass className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform duration-300" />
                    </motion.div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-widest animate-pulse">
                                CLICKER / IDLE
                            </span>
                            <h3 className="text-xl font-black mt-3 tracking-wide text-purple-200 group-hover:text-white group-hover:text-shadow-purple transition-all">
                                VOID COLLECTOR
                            </h3>
                            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                                Extract dark particles, upgrade auto-collectors, and gamble your earnings in the void roulette.
                            </p>
                        </div>

                        {/* Stats Banner */}
                        <div className="mt-6 flex justify-between items-center border-t border-purple-500/10 pt-4">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">TOTAL PARTICLES</p>
                                <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-0.5">
                                    {formatNumber(particles)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-purple-500/0 group-hover:shadow-purple-500/30">
                                <Play className="w-4 h-4 text-purple-300 group-hover:text-black group-hover:translate-x-[1px] transition-all" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* GAME CARD: Void Block */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectGame('void_block')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#1b082e] via-[#0e041a] to-[#04010a] p-6 shadow-[0_8px_32px_0_rgba(168,85,247,0.08)] transition-all duration-300 hover:border-purple-500/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] ml-6"
                >
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />

                    {/* Hover Glow Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.22),rgba(0,0,0,0))] transition-all duration-500 group-hover:scale-110" />
                    
                    {/* Floating Icon */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 p-3 text-purple-400/20 group-hover:text-purple-400/50 transition-colors"
                    >
                        <Trophy className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform duration-300" />
                    </motion.div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-widest animate-pulse">
                                MULTIPLAYER / JACKPOT
                            </span>
                            <h3 className="text-xl font-black mt-3 tracking-wide text-purple-200 group-hover:text-white group-hover:text-shadow-purple transition-all">
                                VOID BLOCK
                            </h3>
                            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                                Join the multiplayer cosmic jackpot. Place WLD bets, accumulate the pool, and win the entire pot! 13% fee fuels the community hotwallet.
                            </p>
                        </div>

                        {/* Stats Banner */}
                        <div className="mt-6 flex justify-between items-center border-t border-purple-500/10 pt-4">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">CURRENT JACKPOT</p>
                                <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-0.5">
                                    {voidBlockPool !== null ? `${voidBlockPool.toFixed(2)} WLD` : '...'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-purple-500/0 group-hover:shadow-purple-500/30">
                                <Play className="w-4 h-4 text-purple-300 group-hover:text-black group-hover:translate-x-[1px] transition-all" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* GAME CARD 2: Void Bastion */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectGame('bastion')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#0a0a2f] via-[#04051a] to-[#01020a] p-6 shadow-[0_8px_32px_0_rgba(99,102,241,0.08)] transition-all duration-300 hover:border-indigo-500/60 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]"
                >
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(45deg,transparent_25%,rgba(99,102,241,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />

                    {/* Hover Glow Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.22),rgba(0,0,0,0))] transition-all duration-500 group-hover:scale-110" />
                    
                    {/* Floating Icon */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 p-3 text-indigo-400/20 group-hover:text-indigo-400/50 transition-colors"
                    >
                        <ShieldAlert className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform duration-300" />
                    </motion.div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest animate-pulse">
                                TACTICS / TD
                            </span>
                            <h3 className="text-xl font-black mt-3 tracking-wide text-indigo-200 group-hover:text-white group-hover:text-shadow-indigo transition-all">
                                VOID BASTION
                            </h3>
                            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                                Build tactical turrets, recruit fighter pilots, and defend the command ship against waves of dark invaders.
                            </p>
                        </div>

                        {/* Stats Banner */}
                        <div className="mt-6 flex justify-between items-center border-t border-indigo-500/10 pt-4">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">MAX WAVE</p>
                                    <p className="text-base font-black text-indigo-400 mt-0.5 group-hover:text-indigo-300 transition-colors">
                                        {isLoading ? '...' : bastionStats?.highestWave || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">CREDITS</p>
                                    <p className="text-base font-black text-emerald-400 mt-0.5 group-hover:text-emerald-300 transition-colors">
                                        {isLoading ? '...' : formatNumber(bastionStats?.totalCredits || 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-indigo-500/0 group-hover:shadow-indigo-500/30">
                                <Play className="w-4 h-4 text-indigo-300 group-hover:text-black group-hover:translate-x-[1px] transition-all" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* GAME CARD 3: Next Wallet (Ad Card) */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open('https://world.org/mini-app?app_id=app_fc0b450998cdd2fbf6efb90d491f7cce&path=&draft_id=meta_16d33ebc3b71dc5cf29380f6e6306f68', '_blank')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-cyan-400/40 bg-cyan-950/15 p-5 hover:border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.1)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-500 backdrop-blur-md"
                >
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-indigo-500/20" />

                    {/* Hover Glow Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.22),transparent)] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Floating Ad Image/Icon Background */}
                    <div className="absolute top-0 right-0 p-3">
                        <img 
                            src="/next-wallet-icon.jpg" 
                            alt="Next Wallet"
                            className="w-12 h-12 rounded-xl opacity-40 group-hover:opacity-90 group-hover:scale-110 transition-all duration-500 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] object-cover"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                RECOMMENDED WALLET
                            </span>
                            <h3 className="text-xl font-black mt-3 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all">
                                NEXT WALLET
                            </h3>
                            <p className="text-xs text-gray-200/90 mt-1.5 leading-relaxed font-medium">
                                Bezpieczny, połączony i zweryfikowany portfel krypto. Kliknij i odkryj nową oficjalną aplikację w ekosystemie World App!
                            </p>
                        </div>

                        {/* Stats / Action Banner */}
                        <div className="mt-6 flex justify-between items-center border-t border-cyan-500/10 pt-4">
                            <div>
                                <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider font-semibold">
                                    Status
                                </p>
                                <p className="text-sm font-black text-cyan-300 mt-0.5">
                                    LIVE NOW
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-400 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-cyan-500/0 group-hover:shadow-cyan-400/40">
                                <Play className="w-4 h-4 text-cyan-300 group-hover:text-black group-hover:translate-x-[1px] transition-all" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* GAME CARD 4: Void Predictions */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectGame('predictions')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-950/10 p-5 group-hover:border-blue-500/60 hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] transition-all duration-500 backdrop-blur-md"
                >
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10" />

                    {/* Hover Glow Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Floating Icon */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 p-3 text-blue-400/20 group-hover:text-blue-400/35 transition-colors duration-300"
                    >
                        <TrendingUp className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                    </motion.div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-500/15 text-blue-300 border border-blue-500/25 animate-pulse">
                                LIVE PRICE PREDICTIONS
                            </span>
                            <h3 className="text-xl font-black mt-3 tracking-wide text-blue-200 group-hover:text-blue-100 transition-colors">
                                VOID PREDICTIONS
                            </h3>
                            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                                Predict WLD token price moves (UP/DOWN) in real-time. Each prediction costs 0.15 WLD. Win WLD rewards! Limit: 2 predictions per hour.
                            </p>
                        </div>

                        {/* Stats / Action Banner */}
                        <div className="mt-6 flex justify-between items-center border-t border-blue-500/15 pt-4">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                                    ESTIMATED PAYOUT
                                </p>
                                <p className="text-sm font-black text-blue-400 mt-0.5 group-hover:text-blue-300 transition-colors">
                                    1.9X MULTIPLIER
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/0 group-hover:shadow-blue-500/30">
                                <Play className="w-4 h-4 text-blue-300 group-hover:text-black group-hover:translate-x-[1px] transition-all" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.main>

            {/* Footer / Info */}
            <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full max-w-md text-center py-4 z-10 text-[10px] text-white/20 uppercase tracking-widest font-bold"
            >
                SYSTEM SIMULATOR VERSION 3.0.0
            </motion.footer>

            {/* Referral Reward Modal */}
            {showRefModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-sm border border-purple-500/30 bg-[#0e0720] rounded-2xl p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)]"
                    >
                        {/* Particles animation inside modal */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(15)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1.5 h-1.5 rounded-full bg-purple-400"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -100],
                                        opacity: [0, 0.8, 0],
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="text-5xl mb-4 animate-bounce">🎁</div>
                        <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                            PREZENT POWITALNY!
                        </h3>
                        <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                            Dołączyłeś do nas z polecenia {referrerName ? <span className="text-purple-300 font-bold">@{referrerName}</span> : 'znajomego'}.
                            Otrzymujesz bonus startowy:
                            <br />
                            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-1 block">
                                +25 000 PARTICLES!
                            </span>
                        </p>
                        <button
                            onClick={() => setShowRefModal(false)}
                            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 border border-white/10"
                        >
                            Odbierz i Graj 🚀
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Injected custom styles for animations */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-shimmer {
                    animation: shimmer 6s infinite linear;
                }
                .group-hover\\:text-shadow-purple {
                    text-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
                }
                .group-hover\\:text-shadow-indigo {
                    text-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
                }
            `}</style>
        </div>
    )
}
