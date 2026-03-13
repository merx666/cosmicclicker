ssh prod'use client'

import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Image from 'next/image'

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

export default function SeasonPassTab() {
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
                <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-2xl mb-1">✨</span>
                    <span className="font-bold text-sm">+{reward.amount.toLocaleString()}</span>
                </div>
            )
        } else if (reward.type === 'skin') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-xl mb-1">🎨</span>
                    <span className="font-bold text-xs leading-tight">{reward.name}</span>
                </div>
            )
        } else {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-xl mb-1">🌌</span>
                    <span className="font-bold text-xs leading-tight">{reward.name}</span>
                </div>
            )
        }
    }

    return (
        <div className="py-6 px-2 max-w-4xl mx-auto">
            {/* Header / Hero */}
            <div className="mb-8 p-6 bg-gradient-to-r from-void-purple/30 to-void-blue/30 rounded-2xl border border-particle-glow/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <div className="w-32 h-32 bg-particle-glow/20 rounded-full blur-3xl mix-blend-screen" />
                </div>

                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                    🎟️ VOID PASS
                    <span className="px-2 py-1 text-xs font-bold bg-white text-black rounded uppercase tracking-wider">Season 2</span>
                </h2>
                <p className="text-text-secondary mb-6">Earn XP by collecting particles to unlock cosmic rewards.</p>

                {/* Progress Bar */}
                <div className="bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-sm text-text-secondary uppercase font-bold tracking-wider">Current Tier</span>
                            <div className="text-3xl font-black text-particle-glow">{bpLevel}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold">{bpXp} / {currentLevelReq} XP</div>
                            <div className="text-xs text-text-secondary">to next tier</div>
                        </div>
                    </div>

                    <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-void-purple via-void-blue to-particle-glow"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {!hasPremium && (
                    <div className="mt-4 text-center">
                        <button className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold rounded-full transition-transform hover:scale-105 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                            Unlock Premium Pass
                        </button>
                        <p className="text-xs text-white/50 mt-2">Get access to exclusive skins, themes, and massive particle drops!</p>
                    </div>
                )}
            </div>

            {/* Battle Pass Track */}
            <div className="space-y-4 relative">
                {/* Center divider line */}
                <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2 z-0" />

                {/* Track Headers */}
                <div className="flex justify-between text-center sticky top-0 z-10 bg-black/80 backdrop-blur-md py-4 rounded-xl border border-white/10 mb-6">
                    <div className="w-5/12 font-bold text-gray-300 uppercase letter-spacing tracking-widest">Free Track</div>
                    <div className="w-2/12 font-black text-void-blue">TIER</div>
                    <div className={`w-5/12 font-bold uppercase letter-spacing tracking-widest ${hasPremium ? 'text-yellow-400' : 'text-gray-500'}`}>Premium Track</div>
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
                                        h-24 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden cursor-pointer
                                        ${freeClaimed ? 'bg-green-500/10 border-green-500/30 opacity-60' :
                                            canClaimFree ? 'bg-void-blue/20 border-void-blue hover:bg-void-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                                                'bg-white/5 border-white/10 opacity-50 grayscale'}
                                    `}
                                    onClick={() => canClaimFree && handleClaim(tier.level, 'free', tier.freeReward)}
                                    whileTap={canClaimFree ? { scale: 0.95 } : {}}
                                >
                                    {renderRewardIcon(tier.freeReward)}

                                    {freeClaimed && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-green-400 font-bold text-xl uppercase tracking-widest rotate-[-15deg]">Claimed</span>
                                        </div>
                                    )}
                                    {canClaimFree && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-void-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
                                    )}
                                </motion.div>
                            </div>

                            {/* Level Indicator */}
                            <div className="w-[12%] flex justify-center">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-black z-20 shadow-lg border-2
                                    ${isUnlocked ? 'bg-particle-glow text-black border-particle-glow shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'bg-gray-800 text-gray-500 border-gray-700'}
                                    ${isCurrent ? 'ring-4 ring-particle-glow/30' : ''}
                                `}>
                                    {tier.level}
                                </div>
                            </div>

                            {/* Premium Reward Card */}
                            <div className="w-[42%]">
                                <motion.div
                                    className={`
                                        h-24 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden cursor-pointer
                                        ${!hasPremium ? 'bg-gray-900 border-gray-800 opacity-40 grayscale' :
                                            premiumClaimed ? 'bg-amber-500/10 border-amber-500/30 opacity-60' :
                                                canClaimPremium ? 'bg-gradient-to-br from-amber-500/30 to-yellow-600/30 border-amber-400 hover:brightness-110 shadow-[0_0_15px_rgba(251,191,36,0.3)]' :
                                                    'bg-amber-900/20 border-amber-800/50 opacity-50 grayscale'}
                                    `}
                                    onClick={() => canClaimPremium && handleClaim(tier.level, 'premium', tier.premiumReward)}
                                    whileTap={canClaimPremium ? { scale: 0.95 } : {}}
                                >
                                    {renderRewardIcon(tier.premiumReward)}

                                    {premiumClaimed && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-amber-400 font-bold text-xl uppercase tracking-widest rotate-[-15deg]">Claimed</span>
                                        </div>
                                    )}
                                    {!hasPremium && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-gray-400 text-2xl">🔒</span>
                                        </div>
                                    )}
                                    {canClaimPremium && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,1)]" />
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
