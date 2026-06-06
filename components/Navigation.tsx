'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

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
        { id: 'season_pass', label: 'VOID PASS', icon: '🎟️', badge: 'NEW' },
        { id: 'void_club', label: 'VOID CLUB', icon: '🟣' },
        { id: 'ads', label: t('ads') || 'ADS', icon: '📺' },
        { id: 'upgrades', label: t('upgrades'), icon: '/assets/nav/upgrades.png' },
        { id: 'missions', label: t('missions'), icon: '/assets/nav/missions.png' },
        { id: 'leaderboard', label: t('leaderboard'), icon: '/assets/nav/leaderboard.png' },
        { id: 'premium', label: t('premium'), icon: '/assets/nav/premium.png' },
        ...(!isTelegram ? [{ id: 'convert', label: t('convert'), icon: '/assets/nav/convert.png', highlight: true }] : []),
        { id: 'roulette', label: t('machine'), icon: '/assets/nav/roulette.png', badge: freeSpinAvailable ? 'FREE' : undefined },
        { id: 'survey', label: t('survey'), icon: '/assets/nav/survey.png' },
        { id: 'media', label: t('media'), icon: '📡' },
    ]

    return (
        <nav
            className="fixed top-0 bottom-0 left-0 w-[72px] bg-void-dark/95 backdrop-blur-lg border-r border-void-purple/20 z-50 flex flex-col items-center py-4 overflow-y-auto no-scrollbar"
        >
            <div className="flex flex-col gap-2 w-full px-1.5 pb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 w-full relative
                            ${activeTab === tab.id
                                ? 'text-particle-glow bg-particle-glow/10'
                                : 'text-text-secondary hover:text-text-primary'
                            }
                            ${'highlight' in tab && tab.highlight
                                ? 'ring-1 ring-green-400/40 bg-green-500/5'
                                : ''
                            }
                        `}
                    >
                        {/* NEW badge */}
                        {'badge' in tab && tab.badge && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full leading-none z-10 shadow-lg shadow-red-500/30 animate-pulse">
                                {tab.badge}
                            </span>
                        )}
                        {/* Highlight glow for convert */}
                        {'highlight' in tab && tab.highlight && activeTab !== tab.id && (
                            <motion.div
                                className="absolute inset-0 rounded-xl border border-green-400/30"
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                        )}
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            {tab.icon.startsWith('/') ? (
                                <Image
                                    src={tab.icon}
                                    alt={tab.label}
                                    fill
                                    className={`object-contain ${activeTab === tab.id ? 'brightness-125 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'opacity-70 grayscale'}`}
                                />
                            ) : (
                                <span className={`text-xl leading-none ${activeTab === tab.id ? 'brightness-125 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'opacity-70 grayscale'}`}>
                                    {tab.icon}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}
