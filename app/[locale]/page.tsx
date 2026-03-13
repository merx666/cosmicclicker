'use client'

import { useWorldID } from '@/hooks/useWorldID'
import GameScreen from '@/components/GameScreen'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
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

export default function Home() {
  const { isVerified, userAddress, isLoading, error, verify } = useWorldID()
  const t = useTranslations('Home')
  const tCommon = useTranslations('Common')
  const searchParams = useSearchParams()

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)

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

  // Show verification screen if not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-void-dark flex items-center justify-center px-4 safe-area-top safe-area-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌌</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-void-purple to-particle-glow bg-clip-text text-transparent mb-2">
              Void Collector
            </h1>
            <p className="text-text-secondary">
              {t('subtitle')}
            </p>
          </div>

          <div className="bg-void-purple/5 border-2 border-void-purple/30 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold mb-2">{t('verificationTitle')}</h2>
              <p className="text-sm text-text-secondary">
                {t('verificationDesc')}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={verify}
              disabled={isLoading}
              className={`
                w-full py-4 px-6 rounded-xl font-bold text-lg
                bg-gradient-to-r from-void-purple to-void-blue
                hover:scale-105 active:scale-95
                transition-all flex items-center justify-center gap-3
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                  {tCommon('verifying')}
                </>
              ) : (
                <>
                  <span>✨</span>
                  {t('verifyButton')}
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-void-purple/20">
              <p className="text-xs text-text-secondary text-center">
                🔒 {t('secureVerification')}
                <br />
                {t('privacyProtected')}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-text-secondary">
            <p>{t('worldAppRequired')}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // User is verified - show game with their wallet address
  return <GameScreen userHash={userAddress!} />
}
