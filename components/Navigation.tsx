'use client'

import { useState } from 'react'
import Image from 'next/image'

interface NavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
    const trophyIcon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA5SDQuNWEyLjUgMi41IDAgMCAxIDAtNUg2Ii8+PHBhdGggZD0iTTE4IDloMS41YTIuNSAyLjUgMCAwIDAgMC01SDE4Ii8+PHBhdGggZD0iTTQgMjJoMTYiLz48cGF0aCBkPSJNMTAgMTQuNjZWMTdjMCAuNTUtLjQ3Ljk4LS45NyAxLjIxQzcuODUgMTguNzUgNyAyMC4yNCA3IDIyIi8+PHBhdGggZD0iTTE0IDE0LjY2VjE3YzAgLjU1LjQ3Ljk4Ljk3IDEuMjFDMTYuMTUgMTguNzUgMTcgMjAuMjQgMTcgMjIiLz48cGF0aCBkPSJNMTggMkg2djdhNiA2IDAgMCAwIDEyIDBWMloiLz48L3N2Zz4=`

    const tabs = [
        { id: 'collect', label: 'Collect', icon: '/assets/nav/collect.png' },
        { id: 'upgrades', label: 'Upgrades', icon: '/assets/nav/upgrades.png' },
        { id: 'missions', label: 'Missions', icon: '/assets/nav/missions.png' },
        { id: 'leaderboard', label: 'Ranking', icon: trophyIcon },
        { id: 'premium', label: 'Premium', icon: '/assets/nav/premium.png' },
        { id: 'convert', label: 'Convert', icon: '/assets/nav/convert.png' },
        { id: 'roulette', label: 'Roulette', icon: '/assets/nav/roulette.png' },
    ]

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-void-dark/95 backdrop-blur-lg border-t border-void-purple/20 z-50 transition-all pb-8"
        >
            <div className="max-w-2xl mx-auto">
                <div className="flex overflow-x-auto gap-2 py-3 px-2 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[70px] flex-shrink-0
                ${activeTab === tab.id
                                    ? 'text-particle-glow bg-particle-glow/10'
                                    : 'text-text-secondary hover:text-text-primary'
                                }
              `}
                        >
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
            </div>
        </nav>
    )
}
