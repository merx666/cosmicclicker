'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useSearchParams } from 'next/navigation'
import VoidParticle from './VoidParticle'
import ParticleCounter from './ParticleCounter'
import Navigation from './Navigation'
import UpgradesTab from './tabs/UpgradesTab'
import MissionsTab from './tabs/MissionsTab'
import LeaderboardTab from './tabs/LeaderboardTab'
import PremiumTab from './tabs/PremiumTab'
import ConvertTab from './tabs/ConvertTab'
import RouletteTab from './tabs/RouletteTab'
import SurveyTab from './tabs/SurveyTab'
import MediaTab from './tabs/MediaTab'
import VoidClubTab from './tabs/VoidClubTab'
import ContestModal from './ContestModal'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundEffects from './effects/BackgroundEffects'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
import ChangelogModal from './ChangelogModal'
import ApiTinyAd from './ApiTinyAd'

interface GameScreenProps {
    userHash: string
}

export default function GameScreen({ userHash }: GameScreenProps) {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState(initialTab && ['collect', 'void_club', 'upgrades', 'missions', 'leaderboard', 'premium', 'convert', 'roulette', 'survey', 'media'].includes(initialTab) ? initialTab : 'collect')

    // ... (rest of the component)

    {
        activeTab === 'collect' && (
            <motion.div
                key="collect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="py-8"
            >
                <ParticleCounter />
                <VoidParticle />

                {/* Quick stats */}
                <div className="mt-8 text-center text-sm text-text-secondary">
                    <p>{t('clickInstruction')}</p>
                </div>

                <div className="mt-8 mx-auto max-w-xs opacity-50 hover:opacity-100 transition-opacity">
                    <LanguageSwitcher />
                </div>
            </motion.div>
        )
    }

    {
        activeTab === 'void_club' && (
            <motion.div
                key="void_club"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <VoidClubTab />
            </motion.div>
        )
    }

    {
        activeTab === 'upgrades' && (
            <motion.div
                key="upgrades"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <UpgradesTab />
            </motion.div>
        )
    }

    {
        activeTab === 'missions' && (
            <motion.div
                key="missions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <MissionsTab />
            </motion.div>
        )
    }

    {
        activeTab === 'leaderboard' && (
            <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <LeaderboardTab />
            </motion.div>
        )
    }

    {
        activeTab === 'premium' && (
            <motion.div
                key="premium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <PremiumTab />
            </motion.div>
        )
    }

    {
        activeTab === 'convert' && (
            <motion.div
                key="convert"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <ConvertTab />
            </motion.div>
        )
    }

    {
        activeTab === 'roulette' && (
            <motion.div
                key="roulette"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <RouletteTab />
            </motion.div>
        )
    }

    {
        activeTab === 'survey' && (
            <motion.div
                key="survey"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <SurveyTab />
            </motion.div>
        )
    }

    {
        activeTab === 'media' && (
            <motion.div
                key="media"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <MediaTab />
            </motion.div>
        )
    }
                </AnimatePresence >
            </main >


        {/* Ads */ }
        < div className = "pb-4" >
            <ApiTinyAd userWallet={userHash} />
            </div >

        {/* Navigation */ }
        < Navigation activeTab = { activeTab } onTabChange = { setActiveTab } />

        </div >
    )
}
