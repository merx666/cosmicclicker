'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import toast from 'react-hot-toast'
import { MiniKit } from '@worldcoin/minikit-js'

const SOCIAL_LINKS = [
    {
        name: 'X (Twitter)',
        icon: '𝕏',
        url: 'https://x.com/Void_WorldApp',
        color: 'from-gray-700 to-gray-900',
        borderColor: 'border-gray-500/30',
        hoverColor: 'hover:border-gray-400/60',
        textColor: 'text-white',
        available: true,
        description: 'Follow us for updates & announcements',
    },
    {
        name: 'Facebook',
        icon: '📘',
        url: '#',
        color: 'from-blue-800/40 to-blue-900/40',
        borderColor: 'border-blue-500/20',
        hoverColor: '',
        textColor: 'text-blue-300/50',
        available: false,
        description: 'Community page',
    },
    {
        name: 'Discord',
        icon: '🎮',
        url: '#',
        color: 'from-indigo-800/40 to-indigo-900/40',
        borderColor: 'border-indigo-500/20',
        hoverColor: '',
        textColor: 'text-indigo-300/50',
        available: false,
        description: 'Join the community',
    },
]

export default function MediaTab() {
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    const addParticles = useGameStore((state) => state.addParticles)
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const [adLoading, setAdLoading] = useState(false)

    const handleShareReferral = async () => {
        if (!nullifierHash) {
            toast.error('Zaloguj się najpierw przez World ID!')
            return
        }
        
        const appId = process.env.NEXT_PUBLIC_MINIKIT_APP_ID || 'app_prod_xxxx'
        const referralLink = `https://world.org/mini-app?app_id=${appId}&path=%2F%3Fref%3D${nullifierHash}`
        
        try {
            if (MiniKit.isInstalled()) {
                // @ts-ignore
                await MiniKit.commandsAsync.share({
                    text: 'Zbieraj cząsteczki i zarabiaj WLD w nowym idle clickerze! Odbierz +25 000 cząsteczek na start z mojego zaproszenia!',
                    url: referralLink
                })
                toast.success('Udostępniono zaproszenie! 🚀')
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(referralLink)
                toast.success('Link skopiowany do schowka! 🔗')
            } else {
                toast.error('Udostępnianie niedostępne. Skopiuj link ręcznie.')
            }
        } catch (e) {
            console.error('Błąd udostępniania:', e)
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(referralLink)
                toast.success('Link skopiowany do schowka! 🔗')
            } else {
                toast.error('Nie udało się skopiować linku.')
            }
        }
    }

    const handleWatchAd = () => {
        if (typeof window === 'undefined') return
        const showAd = (window as any).show_11049498

        if (!showAd) {
            toast.error('Ad network is loading. Please try again in a moment.')
            return
        }

        setAdLoading(true)
        showAd()
            .then(async () => {
                try {
                    const res = await fetch('/api/telegram/reward-ad', { method: 'POST' })
                    const data = await res.json()
                    if (res.ok && data.success) {
                        addParticles(data.reward)
                        toast.success(`⚡️ Success! You received +${data.reward.toLocaleString()} Particles!`)
                    } else {
                        toast.error(data.error || 'Failed to claim reward')
                    }
                } catch (e) {
                    console.error('Failed to claim ad reward:', e)
                    toast.error('Network error. Failed to claim reward.')
                } finally {
                    setAdLoading(false)
                }
            })
            .catch((err: any) => {
                console.warn('Ad skipped or failed:', err)
                toast.error('Ad skipped or failed to load. No reward granted.')
                setAdLoading(false)
            })
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h2 className="text-2xl font-bold text-white mb-1">📡 MEDIA & INFO</h2>
                <p className="text-text-secondary text-sm">Stay connected with the Void Collector community</p>
            </motion.div>

            {/* World App Referral Widget (World App Only) */}
            {!isTelegram && nullifierHash && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-gradient-to-br from-[#120724] via-[#090412] to-[#030105] p-5"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(168,85,247,0.15),transparent)] pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-2 inline-block">
                                SYSTEM POLECEŃ
                            </span>
                            <h3 className="text-lg font-black text-purple-300">ZAPROŚ ZNAJOMYCH</h3>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                Udostępnij swój unikalny reflink znajomym! 
                                <br />
                                Gdy dołączą do gry:
                                <br />
                                <span className="text-[#00ffcc] font-black text-xs block mt-1">
                                    🎁 Ty otrzymasz: <span className="text-sm">+50 000 cząsteczek!</span>
                                </span>
                                <span className="text-purple-400 font-black text-xs block mt-0.5">
                                    🚀 Znajomy otrzyma: <span className="text-sm">+25 000 cząsteczek!</span>
                                </span>
                            </p>
                        </div>
                        <div className="text-4xl filter drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">🔗</div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <button
                            onClick={handleShareReferral}
                            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all active:scale-[0.98] hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-white/10"
                        >
                            ZAPROŚ ZNAJOMYCH 🚀
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Rewarded Ad Section (Telegram Only) */}
            {isTelegram && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-gradient-to-br from-[#072418] via-[#04120c] to-[#010403] p-5"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-2 inline-block">
                                REWARDED ADS
                            </span>
                            <h3 className="text-lg font-black text-emerald-300">WATCH AD & EARN</h3>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                Watch a quick sponsored video to receive a massive instant boost of:
                                <br />
                                <span className="text-[#00ffcc] font-black text-sm block mt-0.5">🚀 +10 000 PARTICLES!</span>
                            </p>
                        </div>
                        <div className="text-4xl filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse">📺</div>
                    </div>

                    <button
                        onClick={handleWatchAd}
                        disabled={adLoading}
                        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-white/10"
                    >
                        {adLoading ? 'LOADING AD...' : 'WATCH AD NOW 📺'}
                    </button>
                </motion.div>
            )}

            {/* Contest Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden border border-void-purple/50 shadow-[0_0_20px_rgba(107,47,181,0.2)] group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-void-purple/20 to-void-blue/20 backdrop-blur-md" />
                <div className="relative p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="bg-gradient-to-r from-void-purple to-void-blue px-2 py-0.5 rounded text-[10px] font-bold text-white mb-2 inline-block">
                                LIMITED TIME
                            </span>
                            <h3 className="text-xl font-bold text-white mb-1">250 WLD GIVEAWAY</h3>
                            <p className="text-sm text-gray-300 mb-1">
                                Follow & Repost to win <span className="text-void-purple font-bold">250 WLD</span>!
                            </p>
                            <p className="text-[10px] text-gray-400 mb-3">
                                Previous Winner: <span className="font-mono text-gray-300">0x9fC4...2f6A</span> (Unclaimed)
                            </p>
                        </div>
                        <div className="text-4xl animate-pulse">🎁</div>
                    </div>

                    <a
                        href="https://x.com/Void_WorldApp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 rounded-xl bg-white text-void-dark font-bold text-center text-sm
                                 hover:bg-gray-100 active:scale-[0.98] transition-all"
                    >
                        Join Contest on X →
                    </a>
                </div>
            </motion.div>

            {/* Social Links */}
            <div className="space-y-3">
                {SOCIAL_LINKS.map((link, index) => (
                    <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {link.available ? (
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                    block w-full p-4 rounded-2xl border ${link.borderColor} ${link.hoverColor}
                                    bg-gradient-to-r ${link.color} backdrop-blur-sm
                                    transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                    hover:shadow-lg hover:shadow-white/5
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white/10">
                                        {link.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${link.textColor}`}>{link.name}</span>
                                            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">Live</span>
                                        </div>
                                        <p className="text-text-secondary text-xs mt-0.5">{link.description}</p>
                                    </div>
                                    <span className="text-text-secondary text-lg">→</span>
                                </div>
                            </a>
                        ) : (
                            <div
                                className={`
                                    block w-full p-4 rounded-2xl border ${link.borderColor}
                                    bg-gradient-to-r ${link.color} backdrop-blur-sm
                                    opacity-60 cursor-not-allowed
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white/5">
                                        {link.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${link.textColor}`}>{link.name}</span>
                                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase">Coming Soon</span>
                                        </div>
                                        <p className="text-text-secondary text-xs mt-0.5">{link.description}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 p-4 rounded-2xl border border-void-purple/20 bg-void-purple/5 backdrop-blur-sm"
            >
                <h3 className="text-sm font-bold text-particle-glow mb-2">ℹ️  ABOUT VOID COLLECTOR</h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                    Void Collector is a World App Mini App where you collect Void Particles,
                    compete on leaderboards, and convert your particles into real WLD.
                    Follow us on social media to stay updated with the latest features
                    and community events!
                </p>
                <div className="mt-3 pt-3 border-t border-void-purple/10">
                    <p className="text-[10px] text-text-secondary/50">
                        Version 2.1 • Built on World Chain • Powered by MiniKit
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
