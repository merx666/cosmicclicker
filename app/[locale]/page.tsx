'use client'

import { useWorldID } from '@/hooks/useWorldID'
import GameScreen from '@/components/GameScreen'
import VerificationScreen from '@/components/VerificationScreen'
import Season3PRScreen from '@/components/Season3PRScreen'
import SelectionMenuScreen from '@/components/SelectionMenuScreen'
import VoidBastionScreen from '@/components/VoidBastionScreen'
import VoidWheelScreen from '@/components/VoidWheelScreen'
import VoidPredictionsScreen from '@/components/VoidPredictionsScreen'
import VoidBlockScreen from '@/components/VoidBlockScreen'
import ChangelogModal from '@/components/ChangelogModal'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import ApiTinyAd from '@/components/ApiTinyAd'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Admin bypass key — must match MAINTENANCE_BYPASS_KEY env var on server
const BYPASS_KEY = 'voidseason2admin'

function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-void-dark flex items-center justify-center px-4 safe-area-top safe-area-bottom overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#a855f7', '#6366f1', '#3b82f6', '#06b6d4'][i % 4],
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-lg w-full relative z-10"
      >
        {/* Season 2 Badge */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 uppercase">
              Season 2
            </span>
          </div>
        </motion.div>

        {/* Animated Cog Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            className="relative w-24 h-24"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 to-transparent rounded-full blur-xl" />
            <div className="relative w-full h-full flex items-center justify-center text-6xl">
              ⚙️
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-black text-center mb-3 bg-gradient-to-r from-purple-400 via-white to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          UPDATE IN PROGRESS
        </motion.h1>

        <motion.p
          className="text-center text-gray-400 mb-8 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          We&apos;re preparing <span className="text-white font-semibold">Season 2</span> with exciting new features.
          <br />Come back in a few hours!
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-full max-w-xs mx-auto mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 rounded-full"
              style={{ backgroundSize: '200% 100%' }}
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
                width: ['20%', '80%', '45%', '90%', '60%'],
              }}
              transition={{
                backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
                width: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2 uppercase tracking-widest">
            Deploying new systems...
          </p>
        </motion.div>

        {/* What's Coming Teaser */}
        <motion.div
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">
            What&apos;s Coming in Season 2
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🏆', label: 'Battle Pass' },
              { icon: '⚡', label: 'Timed Events' },
              { icon: '🎖️', label: 'Achievements' },
              { icon: '📊', label: 'Weekly Rankings' },
              { icon: '🔄', label: 'Prestige System' },
              { icon: '🎮', label: 'New Minigames' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-2 text-sm text-gray-400"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
              >
                <span className="text-lg">{feature.icon}</span>
                <span>{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-[11px] text-gray-600 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Follow us for updates • void.skyreel.art
        </motion.p>
      </motion.div>
    </div>
  )
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        initData: string
        themeParams: any
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        }
      }
    }
  }
}

export default function Home() {
  const { isVerified, userAddress, isLoading, error, verify, logout } = useWorldID()
  const searchParams = useSearchParams()

  // Capture Worldcoin referral from query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ref = searchParams.get('ref')
      if (ref) {
        window.sessionStorage.setItem('worldcoin_referrer', ref)
        console.log('[Worldcoin Referral] Saved referrer in session storage:', ref)
      }
    }
  }, [searchParams])

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)
  const [selectedGame, setSelectedGame] = useState<'menu' | 'collector' | 'bastion' | 'wheel' | 'predictions' | 'void_block'>('menu')
  const loadGameState = useGameStore((state) => state.loadGameState)
  const particles = useGameStore((state) => state.particles)

  // Telegram TMA integration states
  const [isTelegram, setIsTelegram] = useState(false)
  const [tgUser, setTgUser] = useState<any>(null)
  const [tgLoading, setTgLoading] = useState(true)

  // Register Service Worker for validation/monetization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  }, [])

  // Telegram TMA auto-login detector with polling to handle script loading races
  useEffect(() => {
    let checkInterval: NodeJS.Timeout
    let retries = 0

    const initTelegram = async () => {
      const webapp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null
      if (webapp) {
        if (checkInterval) clearInterval(checkInterval)
        webapp.ready()
        webapp.expand()

        const initData = webapp.initData || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('tg_init_data') : '')

        if (initData) {
          setIsTelegram(true)
          try {
            const res = await fetch('/api/auth/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData })
            })
            const data = await res.json()
            if (res.ok && data.success && data.user) {
              setTgUser(data.user)
              console.log('[Telegram Auth] Automatically logged in as:', data.user.address)
              loadGameState(data.user.address)

              if (data.referralClaimed) {
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('referral_claimed', 'true')
                  if (data.referrerUsername) {
                    window.sessionStorage.setItem('referrer_username', data.referrerUsername)
                  }
                }
              }
            } else {
              console.error('[Telegram Auth] Failed to authenticate initData:', data.error)
            }
          } catch (e) {
            console.error('[Telegram Auth] Connection error:', e)
          } finally {
            setTgLoading(false)
          }
        } else {
          console.warn('[Telegram Auth] WebApp detected, but initData is empty')
          setTgLoading(false)
        }
      } else {
        retries++
        if (retries > 30) { // Clear check after 3 seconds
          if (checkInterval) clearInterval(checkInterval)
          console.warn('[Telegram Auth] WebApp not found after 30 retries')
          setTgLoading(false)
        }
      }
    }

    // Run check immediately on mount
    initTelegram()

    // If not found yet, poll every 100ms
    if (typeof window !== 'undefined' && !(window as any).Telegram?.WebApp) {
      checkInterval = setInterval(initTelegram, 100)
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [loadGameState])

  // Check if admin bypass is active via URL param
  const bypassParam = searchParams.get('bypass')
  const isAdminBypass = bypassParam === BYPASS_KEY

  // Check maintenance status on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance')
        const data = await res.json()
        setMaintenanceMode(data.maintenance)
      } catch {
        // If API fails, assume no maintenance
        setMaintenanceMode(false)
      } finally {
        setCheckingMaintenance(false)
      }
    }
    checkMaintenance()
  }, [])

  const isTelegramBuild = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

  useEffect(() => {
    if (isVerified && userAddress && !isTelegram && !isTelegramBuild) {
      loadGameState(userAddress)
    }
  }, [isVerified, userAddress, loadGameState, isTelegram, isTelegramBuild])

  // Show loading while checking maintenance
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen bg-void-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
      </div>
    )
  }

  // Show maintenance screen (unless admin bypass)
  if (maintenanceMode && !isAdminBypass) {
    return <MaintenanceScreen />
  }

  // Hybrid authentication verification logic
  const isAuthenticated = isTelegramBuild ? !!tgUser : (isTelegram ? !!tgUser : isVerified)
  const isAuthLoading = isTelegramBuild ? tgLoading : (isTelegram ? tgLoading : false)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-void-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
      </div>
    )
  }

  // Show verification screen if not verified
  if (!isAuthenticated) {
    if (isTelegramBuild || isTelegram) {
      const hasTelegramWebApp = typeof window !== 'undefined' && (!!window.Telegram?.WebApp?.initData || (typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('tg_init_data')))

      if (!hasTelegramWebApp) {
        return (
          <div className="min-h-screen bg-void-dark flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.15) 0%, transparent 50%)',
              }}
            />
            <div className="relative z-10 max-w-md w-full border border-purple-500/20 bg-purple-950/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
              <h1 className="text-4xl font-extrabold mb-3 tracking-tighter bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                VOID COLLECTOR
              </h1>
              <div className="text-5xl mb-6">🤖</div>
              <h2 className="text-xl font-bold text-white mb-3">Graj w Telegramie</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Ta wersja Void Collector jest przeznaczona wyłącznie jako Telegram Mini App. Uruchom grę bezpośrednio w Telegramie, aby zacząć zarabiać i zbierać cząsteczki.
              </p>
              <a 
                href="https://t.me/Voidbot_official_bot/play" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block w-full py-4 px-8 rounded-xl font-bold text-base uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 border border-white/10 active:scale-[0.98] hover:scale-[1.02]"
              >
                Otwórz w Telegramie
              </a>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-void-dark flex items-center justify-center text-white p-6 text-center">
          <div className="max-w-md w-full border border-red-500/20 bg-red-950/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Autoryzacja Telegram Nieudana</h2>
            <p className="text-sm text-gray-400">
              Nie udało się bezpiecznie zweryfikować Twojej sesji Telegram. Zamknij aplikację i uruchom ją ponownie z oficjalnego bota.
            </p>
          </div>
        </div>
      )
    }

    return (
      <VerificationScreen
        onVerify={verify}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  const displayName = (isTelegramBuild || isTelegram)
    ? (tgUser?.telegramUsername ? `@${tgUser.telegramUsername}` : 'Telegram Officer')
    : (userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Anonymous Officer')

  const activeAddress = (isTelegramBuild || isTelegram) ? tgUser?.address : userAddress

  return (
    <div className="min-h-screen bg-void-dark text-white flex flex-col justify-between relative overflow-hidden">
      <div className="flex-1">
        {selectedGame === 'menu' && (
          <SelectionMenuScreen
            username={displayName}
            particles={particles}
            onSelectGame={(game) => setSelectedGame(game)}
          />
        )}

        {selectedGame === 'collector' && (
          <GameScreen userHash={activeAddress!} onBackToMenu={() => setSelectedGame('menu')} />
        )}

        {selectedGame === 'bastion' && (
          <VoidBastionScreen onBackToMenu={() => setSelectedGame('menu')} />
        )}

        {selectedGame === 'wheel' && (
          <VoidWheelScreen onBackToMenu={() => setSelectedGame('menu')} />
        )}

        {selectedGame === 'predictions' && (
          <VoidPredictionsScreen onBackToMenu={() => setSelectedGame('menu')} />
        )}

        {selectedGame === 'void_block' && (
          <VoidBlockScreen onBackToMenu={() => setSelectedGame('menu')} />
        )}
      </div>

      {/* Global Ads visible on all screens except the main collector game (since collector has sidebar styling) */}
      {selectedGame !== 'collector' && (
        <div className="w-full flex justify-center py-4 bg-void-dark/80 backdrop-blur-md border-t border-void-purple/10 z-40">
          <ApiTinyAd userWallet={activeAddress!} />
        </div>
      )}
      <ChangelogModal />
    </div>
  )
}
