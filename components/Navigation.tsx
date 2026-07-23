'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Ticket } from 'lucide-react'

interface NavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
    const t = useTranslations('Navigation')
    const [freeSpinAvailable, setFreeSpinAvailable] = useState(false)

    // Check free spin availability for badge
    useEffect(() => {
        const checkFreeSpin = () => {
            const lastFree = localStorage.getItem('last_free_spin')
            if (!lastFree) {
                setFreeSpinAvailable(true)
                return
            }
            const elapsed = Date.now() - parseInt(lastFree)
            setFreeSpinAvailable(elapsed >= 24 * 60 * 60 * 1000)
        }
        checkFreeSpin()
        const interval = setInterval(checkFreeSpin, 30000)
        return () => clearInterval(interval)
    }, [])

    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    const tabs = [
        { id: 'collect', label: t('collect'), icon: '/assets/nav/collect.png' },
        { id: 'season_pass', label: t('seasonPass'), icon: <Ticket className="w-5 h-5 text-current" />, badge: t('newBadge') },
        { id: 'upgrades', label: t('upgrades'), icon: '/assets/nav/upgrades.png' },
        { id: 'missions', label: t('missions'), icon: '/assets/nav/missions.png' },
        { id: 'leaderboard', label: t('leaderboard'), icon: '/assets/nav/leaderboard.png' },
        { id: 'premium', label: t('premium'), icon: '/assets/nav/premium.png' },
        ...(!isTelegram ? [{ id: 'convert', label: t('convert'), icon: '/assets/nav/convert.png', highlight: true }] : []),
    ]

    return (
        <nav
            className="fixed bottom-4 left-4 right-4 h-[72px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 flex items-center px-2 overflow-x-auto no-scrollbar rounded-3xl"
        >
            <div className="flex gap-2 h-full items-center justify-between w-full min-w-max">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300 min-w-[64px] relative active:scale-95
                            ${activeTab === tab.id
                                ? 'text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                            }
                            ${'highlight' in tab && tab.highlight
                                ? 'border border-particle-glow/30 bg-particle-glow/5'
                                : ''
                            }
                        `}
                    >
                        {/* NEW badge */}
                        {'badge' in tab && tab.badge && (
                            <span className="absolute -top-1 -right-1 bg-particle-glow text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full leading-none z-10 shadow-lg shadow-particle-glow/40 animate-pulse">
                                {tab.badge}
                            </span>
                        )}
                        {/* Highlight glow for convert */}
                        {'highlight' in tab && tab.highlight && activeTab !== tab.id && (
                            <motion.div
                                className="absolute inset-0 rounded-2xl border border-particle-glow/40"
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                        )}
                        <div className="relative w-6 h-6 flex items-center justify-center mb-0.5">
                            {typeof tab.icon === 'string' && tab.icon.startsWith('/') ? (
                                <Image
                                    src={tab.icon}
                                    alt={tab.label}
                                    fill
                                    className={`object-contain transition-all duration-300 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-60 saturate-50'}`}
                                />
                            ) : (
                                <span className={`flex items-center justify-center text-xl leading-none transition-all duration-300 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-60 saturate-50'}`}>
                                    {tab.icon}
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold tracking-wide truncate w-full text-center leading-tight transition-all duration-300 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70 font-medium'}`}>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    )
}
