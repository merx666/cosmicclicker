'use client'

import { motion } from 'framer-motion'

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
