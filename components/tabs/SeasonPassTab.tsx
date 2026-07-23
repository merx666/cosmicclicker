'use client'

import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Ticket, Sparkles, Palette, Moon, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Definitions for the battle pass rewards
const PASS_LEVELS = 20

type RewardType = { type: 'particles', amount: number } | { type: 'skin', id: string, name: string } | { type: 'theme', id: string, name: string }

interface PassLevel {
    level: number
    xpRequired: number
    freeReward: RewardType
    premiumReward: RewardType
}

const generateRewards = (): PassLevel[] => {
    const levels: PassLevel[] = []
    for (let i = 1; i <= PASS_LEVELS; i++) {
        // Base formula: 100 XP per level
        const xpRequired = i * 100

        // Free track: mainly particles
        const freeReward: RewardType = i % 10 === 0
            ? { type: 'particles', amount: i * 1000 } // Big milestone
            : { type: 'particles', amount: i * 150 }

        // Premium track: much more particles, some cosmetics
        let premiumReward: RewardType = { type: 'particles', amount: i * 500 }

        if (i === 5) premiumReward = { type: 'skin', id: 'rainbow', name: 'Rainbow Skin' }
        if (i === 10) premiumReward = { type: 'theme', id: 'nebula', name: 'Nebula Theme' }
        if (i === 15) premiumReward = { type: 'skin', id: 'gold', name: 'Golden Skin' }
        if (i === 20) premiumReward = { type: 'theme', id: 'galaxy', name: 'Galaxy Theme' }

        levels.push({
            level: i,
            xpRequired,
            freeReward,
            premiumReward
        })
    }
    return levels
}

const rewards = generateRewards()

interface SeasonPassTabProps {
    onUnlockPremium?: () => void
}

export default function SeasonPassTab({ onUnlockPremium }: SeasonPassTabProps) {
    const t = useTranslations('SeasonPass')
    const {
        bpLevel,
        bpXp,
        bpPremium,
        premiumVIP,
        bpClaimedFree,
        bpClaimedPremium,
        claimBpReward
    } = useGameStore()

    // VIP automatically unlocks standard Battle Pass Premium
    const hasPremium = bpPremium || premiumVIP

    const handleClaim = (level: number, type: 'free' | 'premium', reward: RewardType) => {
        let success = false
        if (reward.type === 'particles') {
            success = claimBpReward(level, type, reward.amount)
        } else {
            success = claimBpReward(level, type, 0, reward.type, reward.id)
        }

        if (success) {
            toast.success(`🎉 Claimed Level ${level} ${type.toUpperCase()} reward!`)
        } else {
            toast.error('Could not claim reward (level too low or already claimed)')
        }
    }

    const currentLevelReq = bpLevel * 100
    const progressPercent = Math.min((bpXp / currentLevelReq) * 100, 100)

    const renderRewardIcon = (reward: RewardType) => {
        if (reward.type === 'particles') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <Sparkles className="w-5 h-5 mb-1 text-white/80" />
                    <span className="font-bold text-xs">+{reward.amount.toLocaleString()}</span>
                </div>
            )
        } else if (reward.type === 'skin') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-white px-2">
                    <Palette className="w-4 h-4 mb-1 text-white/80" />
                    <span className="font-bold text-[10px] leading-tight uppercase">{reward.name}</span>
                </div>
            )
        } else {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-white px-2">
                    <Moon className="w-4 h-4 mb-1 text-white/80" />
                    <span className="font-bold text-[10px] leading-tight uppercase">{reward.name}</span>
                </div>
            )
        }
    }

    return (
        <div className="py-6 px-4 max-w-2xl mx-auto">
            {/* Header / Hero */}
            <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden">
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3 text-white">
                    <Ticket className="w-8 h-8 text-white/80" />
                    {t('title')}
                    <span className="px-2 py-1 text-[10px] font-bold bg-white text-black rounded uppercase tracking-widest">{t('season')}</span>
                </h2>
                <p className="text-white/50 text-sm mb-6">{t('description')}</p>

                {/* Progress Bar */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">{t('currentTier')}</span>
                            <div className="text-2xl font-black text-white">{bpLevel}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-white">{bpXp} / {currentLevelReq} XP</div>
                            <div className="text-[10px] text-white/50 uppercase tracking-widest">{t('toNextTier')}</div>
                        </div>
                    </div>

                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {!hasPremium && (
                    <div className="mt-6 text-center">
                        <button 
                            onClick={onUnlockPremium}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl transition-transform active:scale-95 text-sm"
                        >
                            {t('unlockPremium')}
                        </button>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mt-3">{t('premiumDesc')}</p>
                    </div>
                )}
            </div>

            {/* Battle Pass Track */}
            <div className="space-y-3 relative">
                {/* Center divider line */}
                <div className="absolute left-[50%] top-12 bottom-0 w-[1px] bg-white/10 -translate-x-1/2 z-0" />

                {/* Track Headers */}
                <div className="flex justify-between text-center sticky top-0 z-10 bg-[#0f1035] py-4 mb-4">
                    <div className="w-5/12 font-bold text-white/50 text-[10px] uppercase tracking-widest">{t('freeTrack')}</div>
                    <div className="w-2/12 font-black text-white/80 text-[10px] uppercase tracking-widest">{t('tier')}</div>
                    <div className={`w-5/12 font-bold text-[10px] uppercase tracking-widest ${hasPremium ? 'text-white/80' : 'text-white/40'}`}>{t('premiumTrack')}</div>
                </div>

                {/* Tiers List */}
                {rewards.map((tier) => {
                    const isUnlocked = bpLevel >= tier.level
                    const isCurrent = bpLevel === tier.level

                    const freeClaimed = bpClaimedFree.includes(tier.level.toString())
                    const premiumClaimed = bpClaimedPremium.includes(tier.level.toString())

                    const canClaimFree = isUnlocked && !freeClaimed
                    const canClaimPremium = isUnlocked && hasPremium && !premiumClaimed

                    return (
                        <div key={tier.level} className={`flex items-center justify-between relative z-10 ${isCurrent ? 'scale-[1.02] transform transition-transform' : ''}`}>

                            {/* Free Reward Card */}
                            <div className="w-[42%]">
                                <motion.div
                                    className={`
                                        h-20 rounded-2xl border flex items-center justify-center relative overflow-hidden cursor-pointer transition-colors
                                        ${freeClaimed ? 'bg-white/5 border-white/10 opacity-50' :
                                            canClaimFree ? 'bg-white/10 border-white/30 hover:bg-white/20' :
                                                'bg-white/5 border-white/5 opacity-50'}
                                    `}
                                    onClick={() => canClaimFree && handleClaim(tier.level, 'free', tier.freeReward)}
                                    whileTap={canClaimFree ? { scale: 0.95 } : {}}
                                >
                                    {renderRewardIcon(tier.freeReward)}

                                    {freeClaimed && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-white/80 font-bold text-[10px] uppercase tracking-widest">{t('claimed')}</span>
                                        </div>
                                    )}
                                    {canClaimFree && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    )}
                                </motion.div>
                            </div>

                            {/* Level Indicator */}
                            <div className="w-[12%] flex justify-center">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-black z-20 border text-xs
                                    ${isUnlocked ? 'bg-white text-black border-white' : 'bg-black text-white/30 border-white/10'}
                                    ${isCurrent ? 'ring-4 ring-white/10' : ''}
                                `}>
                                    {tier.level}
                                </div>
                            </div>

                            {/* Premium Reward Card */}
                            <div className="w-[42%]">
                                <motion.div
                                    className={`
                                        h-20 rounded-2xl border flex items-center justify-center relative overflow-hidden cursor-pointer transition-colors
                                        ${!hasPremium ? 'bg-black/50 border-white/5 opacity-40' :
                                            premiumClaimed ? 'bg-white/5 border-white/10 opacity-50' :
                                                canClaimPremium ? 'bg-white/10 border-white/30 hover:bg-white/20' :
                                                    'bg-white/5 border-white/10 opacity-50'}
                                    `}
                                    onClick={() => canClaimPremium && handleClaim(tier.level, 'premium', tier.premiumReward)}
                                    whileTap={canClaimPremium ? { scale: 0.95 } : {}}
                                >
                                    {renderRewardIcon(tier.premiumReward)}

                                    {premiumClaimed && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-white/80 font-bold text-[10px] uppercase tracking-widest">{t('claimed')}</span>
                                        </div>
                                    )}
                                    {!hasPremium && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-white/40" />
                                        </div>
                                    )}
                                    {canClaimPremium && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    )}
                                </motion.div>
                            </div>

                        </div>
                    )
                })}
            </div>

            {/* End of pass spacer */}
            <div className="h-12" />
        </div>
    )
}
