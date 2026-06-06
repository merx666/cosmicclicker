'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

import DailyRewardModal from '@/components/UI/DailyRewardModal'
import ShopModal from '@/components/UI/ShopModal'
import LeaderboardModal from '@/components/UI/LeaderboardModal'
import DifficultySelectorModal from '@/components/UI/DifficultySelectorModal'
import LoadingScreen from '@/components/UI/LoadingScreen'
import OnboardingModal from '@/components/UI/OnboardingModal'
import GuideModal from '@/components/UI/GuideModal'
import GameOverModal from '@/components/UI/GameOverModal'
import ToastNotification, { showToast } from '@/components/UI/ToastNotification'
import ConsumableBar from '@/components/UI/ConsumableBar'

// VOID BASTION COMPONENTS
import { MobileLayout } from '@/components/VoidBastion/MobileLayout'
import { Header } from '@/components/VoidBastion/Header'
import { GameLobby } from '@/components/VoidBastion/GameLobby'
import { BottomNavigation } from '@/components/VoidBastion/BottomNavigation'

// Dynamic Phaser Import (No SSR)
const PhaserGame = dynamic(() => import('@/components/Game/PhaserGame'), { ssr: false })

interface VoidBastionScreenProps {
    onBackToMenu: () => void
}

export default function VoidBastionScreen({ onBackToMenu }: VoidBastionScreenProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [showLoadingScreen, setShowLoadingScreen] = useState(true)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [difficulty, setDifficulty] = useState<'easy' | 'hard' | 'insane' | 'pvp'>('easy')

    // HUD State
    const [showRewards, setShowRewards] = useState(false)
    const [showShop, setShowShop] = useState(false)
    const [showDifficultySelector, setShowDifficultySelector] = useState(false)
    const [shopHighlight, setShopHighlight] = useState<string | undefined>(undefined)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [showComingSoon, setShowComingSoon] = useState(false)
    const [showGameOver, setShowGameOver] = useState(false)
    const [gameOverWave, setGameOverWave] = useState(0)

    // Tab State
    const [activeTab, setActiveTab] = useState('play')

    // Data State
    const [userData, setUserData] = useState<any>(null)
    const [energyData, setEnergyData] = useState<any>(null)
    const [leaderboard, setLeaderboard] = useState<any>(null)
    const [leaderboardType, setLeaderboardType] = useState<'wave' | 'spending' | 'streak' | 'voidbastion'>('voidbastion')

    // Fetch User Profile
    const fetchUserData = async () => {
        try {
            const res = await fetch('/api/user/profile')
            if (res.ok) {
                const data = await res.json()
                setUserData(data)

                const uid = data?.user?.id
                if (uid) {
                    fetchEnergy(uid)
                }
            }

            const streakRes = await fetch('/api/rewards/streak')
            if (streakRes.ok) {
                const streakData = await streakRes.json()
                if (streakData.canClaim) {
                    setTimeout(() => setShowRewards(true), 1500)
                }
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error)
        }
    }

    const fetchEnergy = async (userId: string) => {
        try {
            const res = await fetch('/api/energy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status', userId })
            })
            if (res.ok) {
                const data = await res.json()
                setEnergyData(data)
            }
        } catch (error) {
            console.error('Failed to fetch energy:', error)
        }
    }

    // Fetch Leaderboard
    const fetchLeaderboard = async (type: 'wave' | 'spending' | 'streak' | 'voidbastion') => {
        try {
            const res = await fetch(`/api/leaderboard?type=${type}&limit=50`)
            if (res.ok) {
                const data = await res.json()
                setLeaderboard(data.leaderboard || [])
                setLeaderboardType(type)
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
            setLeaderboard([])
        }
    }

    useEffect(() => {
        fetchUserData()
        setShowLoadingScreen(true)
        const timer = setTimeout(() => {
            setShowLoadingScreen(false)

            // Check if user has seen onboarding
            const hasSeenOnboarding = localStorage.getItem('void_onboarding_seen')
            if (!hasSeenOnboarding && !showOnboarding) {
                setTimeout(() => setShowOnboarding(true), 500)
            }
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (showLeaderboard && !leaderboard) {
            fetchLeaderboard('voidbastion')
        }
    }, [showLeaderboard])

    const handlePlayClick = () => {
        setShowDifficultySelector(true)
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        if (tab === 'armory') {
            setShowShop(true)
        } else if (tab === 'ranks') {
            setShowLeaderboard(true)
        } else if (tab === 'guide') {
            setShowGuide(true)
        } else if (tab === 'multiplayer') {
            setShowComingSoon(true)
        }
    }

    // Revive Logic
    const handleRevive = async () => {
        const hasToken = userData?.inventory?.some((i: any) => i.item_id === 'revive_token' && i.quantity > 0)
        if (hasToken) {
            window.dispatchEvent(new CustomEvent('game-revive'))
        } else {
            setShopHighlight('revive_token')
            setShowShop(true)
        }
    }

    // Game Event Listeners
    useEffect(() => {
        const handleGameOver = (e: any) => {
            console.log("Game Over Event received", e.detail)
            if (e.detail.reason === 'boss_wave') {
                // Boss wave paused logic if any
            } else {
                setGameOverWave(e.detail.wave || 0)
                setShowGameOver(true)
            }
        }

        const handleShowOffer = (e: any) => {
            if (e.detail.reason === 'boss_wave') {
                setShopHighlight('boss_killer_turret')
                setShowShop(true)
            }
        }

        window.addEventListener('game-over', handleGameOver)
        window.addEventListener('show-offer', handleShowOffer)
        return () => {
            window.removeEventListener('game-over', handleGameOver)
            window.removeEventListener('show-offer', handleShowOffer)
        }
    }, [userData])

    if (showLoadingScreen) {
        return <LoadingScreen onComplete={() => setShowLoadingScreen(false)} minimumDuration={3000} />
    }

    if (gameStarted) {
        return (
            <div className="relative w-full h-[100dvh] overflow-hidden bg-black font-sans select-none touch-none">
                {/* TOP HUD (Minimal - Exit Button) */}
                <div className="fixed top-0 left-0 right-0 p-2 flex justify-between items-start pointer-events-none z-50 pt-[env(safe-area-inset-top)]">
                    <div className="bg-black/60 backdrop-blur border border-purple-500/30 rounded px-2 py-1 pointer-events-auto cursor-pointer active:scale-95 transition-transform" onClick={() => { setGameStarted(false); setShowGameOver(false); fetchUserData(); }}>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">EXIT</span>
                    </div>
                </div>

                {/* GAME CANVAS */}
                <div className="absolute inset-0 z-0">
                    <PhaserGame difficulty={difficulty} mode="tactics" inventory={userData?.inventory} />
                </div>

                <ConsumableBar inventory={userData?.inventory} onConsumeUpdated={fetchUserData} />

                {/* Game Over Modal */}
                <GameOverModal
                    isOpen={showGameOver}
                    wave={gameOverWave}
                    hasReviveToken={userData?.inventory?.some((i: any) => i.item_id === 'revive_token' && i.quantity > 0) || false}
                    onRevive={() => {
                        setShowGameOver(false)
                        handleRevive()
                    }}
                    onQuit={() => {
                        setShowGameOver(false)
                        setGameStarted(false)
                        fetchUserData()
                    }}
                    onBuyRevive={() => {
                        setShowGameOver(false)
                        setShopHighlight('revive_token')
                        setShowShop(true)
                    }}
                />

                <ToastNotification />
            </div>
        )
    }

    return (
        <MobileLayout>
            <Header
                userName={userData?.user?.username || "Pilot"}
                isVerified={userData?.user?.is_verified}
                onBackToMenu={onBackToMenu}
            />

            <GameLobby
                highestWave={userData?.user?.highestWave || 0}
                totalCredits={userData?.user?.totalCredits || 0}
                onPlay={handlePlayClick}
                onDailyClick={() => setShowRewards(true)}
            />

            <BottomNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onPlay={handlePlayClick}
            />

            {/* Modals */}
            <DailyRewardModal isOpen={showRewards} onClose={() => { setShowRewards(false); fetchUserData(); }} />
            <ShopModal
                isOpen={showShop}
                onClose={() => { setShowShop(false); setShopHighlight(undefined); fetchUserData(); }}
                userInventory={userData?.inventory || []}
                highlightItem={shopHighlight}
            />
            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                data={leaderboard}
                type={leaderboardType}
                onChangeType={(type) => { setLeaderboardType(type); fetchLeaderboard(type); }}
            />

            <AnimatePresence>
                {showOnboarding && (
                    <OnboardingModal onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>

            <DifficultySelectorModal
                isOpen={showDifficultySelector}
                onClose={() => setShowDifficultySelector(false)}
                onSelect={(diff) => {
                    setDifficulty(diff)
                    setGameStarted(true)
                    setShowDifficultySelector(false)
                }}
            />

            <GuideModal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
            />

            {/* Coming Soon Modal for Multiplayer */}
            {showComingSoon && (
                <div
                    onClick={() => setShowComingSoon(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(5,5,16,0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <div style={{
                        background: 'rgba(10,4,21,0.95)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: '20px',
                        padding: '40px 32px',
                        textAlign: 'center',
                        maxWidth: '320px',
                        width: '100%',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#e0e0ff',
                            letterSpacing: '2px',
                            marginBottom: '12px',
                        }}>
                            COMING SOON
                        </h3>
                        <p style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            lineHeight: 1.6,
                        }}>
                            Multiplayer mode is currently under development. Stay tuned for updates!
                        </p>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            style={{
                                marginTop: '20px',
                                padding: '10px 24px',
                                borderRadius: '10px',
                                background: 'rgba(139,92,246,0.15)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                color: '#a78bfa',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <ToastNotification />
        </MobileLayout>
    )
}
