'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
    const t = useTranslations('Navigation')
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showScrollHint, setShowScrollHint] = useState(false)
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

    const tabs = [
        { id: 'collect', label: t('collect'), icon: '/assets/nav/collect.png' },
        { id: 'upgrades', label: t('upgrades'), icon: '/assets/nav/upgrades.png' },
        { id: 'missions', label: t('missions'), icon: '/assets/nav/missions.png' },
        { id: 'leaderboard', label: t('leaderboard'), icon: '/assets/nav/leaderboard.png', badge: 'NEW' },
        { id: 'premium', label: t('premium'), icon: '/assets/nav/premium.png' },
        { id: 'convert', label: t('convert'), icon: '/assets/nav/convert.png', highlight: true },
        { id: 'roulette', label: t('machine'), icon: '/assets/nav/roulette.png', badge: freeSpinAvailable ? 'FREE' : undefined },
        { id: 'survey', label: t('survey'), icon: '/assets/nav/survey.png' },
        { id: 'media', label: t('media'), icon: '📡' },
    ] as const

    // Scroll hint animation on first visit
    useEffect(() => {
        const hintSeen = localStorage.getItem('nav_scroll_hint_seen')
        if (hintSeen) return

        const el = scrollRef.current
        if (!el) return

        setShowScrollHint(true)

        // Start scrolled to the right, then sweep LEFT to reveal hidden tabs
        el.scrollLeft = el.scrollWidth
        const timer = setTimeout(() => {
            el.scrollTo({ left: 0, behavior: 'smooth' })
            setTimeout(() => {
                el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
            }, 1500)
        }, 600)

        // Hide hint after 4 seconds
        const hideTimer = setTimeout(() => {
            setShowScrollHint(false)
            localStorage.setItem('nav_scroll_hint_seen', 'true')
        }, 4000)

        // Also hide on any user scroll
        const handleScroll = () => {
            setShowScrollHint(false)
            localStorage.setItem('nav_scroll_hint_seen', 'true')
        }
        el.addEventListener('scroll', handleScroll, { once: true })

        return () => {
            clearTimeout(timer)
            clearTimeout(hideTimer)
            el.removeEventListener('scroll', handleScroll)
        }
    }, [])

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-void-dark/95 backdrop-blur-lg border-t border-void-purple/20 z-50 transition-all pb-8"
        >
            <div className="max-w-2xl mx-auto relative">
                <div ref={scrollRef} className="flex overflow-x-auto gap-2 py-3 px-2 no-scrollbar scroll-smooth">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[70px] flex-shrink-0 relative
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
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full leading-none z-10 shadow-lg shadow-red-500/30 animate-pulse">
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
                            <div className="relative w-6 h-6 mb-1">
                                <Image
                                    src={tab.icon}
                                    alt={tab.label}
                                    fill
                                    className={`object-contain ${activeTab === tab.id ? 'brightness-125 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'opacity-70 grayscale'}`}
                                />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Scroll hint: arrows on BOTH sides + swipe text */}
                <AnimatePresence>
                    {showScrollHint && (
                        <>
                            {/* Left arrow */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            >
                                <motion.div
                                    animate={{ x: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                                    className="bg-purple-600/80 backdrop-blur-sm rounded-full px-2 py-3 shadow-lg shadow-purple-500/30"
                                >
                                    <span className="text-white text-sm font-bold">←</span>
                                </motion.div>
                            </motion.div>
                            {/* Right arrow */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            >
                                <motion.div
                                    animate={{ x: [0, 8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                                    className="bg-purple-600/80 backdrop-blur-sm rounded-full px-2 py-3 shadow-lg shadow-purple-500/30"
                                >
                                    <span className="text-white text-sm font-bold">→</span>
                                </motion.div>
                            </motion.div>
                            {/* Swipe text hint */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-10"
                            >
                                <span className="text-[10px] text-purple-400 font-bold bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
                                    ← Swipe to explore →
                                </span>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}
