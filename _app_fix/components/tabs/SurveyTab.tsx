'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'

// Vote pricing logic
function getVoteCost(voteNumber: number): number {
    // Votes 1-5: 0.25 * voteNumber (0.25, 0.50, 0.75, 1.00, 1.25)
    // Votes 6-10: after 5th, price increases by 0.50 each (1.75, 2.25, 2.75, 3.25, 3.75)
    if (voteNumber <= 5) {
        return 0.25 * voteNumber
    } else {
        return 1.25 + 0.50 * (voteNumber - 5)
    }
}

interface Poll {
    id: string
    question: string
    yesCount: number
    noCount: number
    userVotes: number
}

export default function SurveyTab() {
    const { nullifierHash } = useGameStore()
    const [poll, setPoll] = useState<Poll>({
        id: 'poll_001',
        question: 'Should we make the game 75% harder?',
        yesCount: 0,
        noCount: 0,
        userVotes: 0,
    })
    const [isVoting, setIsVoting] = useState(false)
    const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null)
    const [showVoteConfirm, setShowVoteConfirm] = useState(false)

    const maxVotes = 10
    const nextVoteNumber = poll.userVotes + 1
    const nextVoteCost = nextVoteNumber <= maxVotes ? getVoteCost(nextVoteNumber) : null
    const totalVotes = poll.yesCount + poll.noCount
    const yesPercent = totalVotes > 0 ? Math.round((poll.yesCount / totalVotes) * 100) : 50
    const noPercent = totalVotes > 0 ? Math.round((poll.noCount / totalVotes) * 100) : 50

    // Load poll data
    useEffect(() => {
        if (!nullifierHash) return
        fetch(`/api/survey/poll?nullifier_hash=${nullifierHash}`)
            .then(res => res.json())
            .then(data => {
                if (data.poll) {
                    setPoll(data.poll)
                }
            })
            .catch(err => console.error('Failed to load poll:', err))
    }, [nullifierHash])

    const handleVoteSelect = (vote: 'yes' | 'no') => {
        if (poll.userVotes >= maxVotes) {
            toast.error('Maximum votes reached (10/10)')
            return
        }
        setSelectedVote(vote)
        setShowVoteConfirm(true)
    }

    const handleVoteConfirm = async () => {
        if (!selectedVote || isVoting || !nextVoteCost) return

        if (!MiniKit.isInstalled()) {
            toast.error('MiniKit not installed')
            return
        }

        setIsVoting(true)

        try {
            const uuid = window.crypto.randomUUID()
            const payload = {
                reference: uuid,
                to: '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc',
                tokens: [
                    {
                        symbol: Tokens.WLD,
                        token_amount: tokenToDecimals(nextVoteCost, Tokens.WLD).toString()
                    }
                ],
                network: Network.WorldChain,
                description: `Survey Vote: ${selectedVote.toUpperCase()} (${nextVoteCost} WLD)`
            }

            const result = await MiniKit.commandsAsync.pay(payload) as any

            if (result?.finalPayload?.status === 'success') {
                const response = await fetch('/api/survey/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nullifier_hash: nullifierHash,
                        poll_id: poll.id,
                        vote: selectedVote,
                        transaction_ref: uuid,
                        vote_cost: nextVoteCost
                    })
                })

                const data = await response.json()

                if (response.ok) {
                    setPoll(prev => ({
                        ...prev,
                        yesCount: data.yesCount,
                        noCount: data.noCount,
                        userVotes: prev.userVotes + 1,
                    }))
                    toast.success(`Vote recorded! (${selectedVote.toUpperCase()})`)
                } else {
                    toast.error(data.error || 'Vote failed')
                }
            } else {
                toast.error('Payment cancelled')
            }
        } catch (error) {
            console.error('Vote error:', error)
            toast.error('Failed to vote')
        } finally {
            setIsVoting(false)
            setShowVoteConfirm(false)
            setSelectedVote(null)
        }
    }

    return (
        <div className="flex flex-col items-center min-h-[70vh] py-6 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <motion.span
                    className="text-4xl inline-block mb-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                    🤖
                </motion.span>
                <h2 className="text-2xl font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                    The Void AI Decides
                </h2>
                <p className="text-xs text-gray-500 mt-2 max-w-xs">
                    Cast your votes. The Void AI will implement the community&apos;s decision.
                    Each vote costs WLD. More votes = louder voice.
                </p>
            </motion.div>

            {/* Poll Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm bg-gradient-to-b from-[#1a1040] to-[#0d0d2b] border border-purple-500/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
            >
                {/* Question */}
                <div className="text-center mb-6">
                    <div className="inline-block bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-3">
                        Active Poll
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                        {poll.question}
                    </h3>
                </div>

                {/* Results Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-green-400">YES {yesPercent}%</span>
                        <span className="text-red-400">{noPercent}% NO</span>
                    </div>
                    <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 flex">
                        <motion.div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full"
                            initial={{ width: '50%' }}
                            animate={{ width: `${yesPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                        <motion.div
                            className="bg-gradient-to-r from-red-600 to-red-500 h-full"
                            initial={{ width: '50%' }}
                            animate={{ width: `${noPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>{poll.yesCount} votes</span>
                        <span>{totalVotes} total</span>
                        <span>{poll.noCount} votes</span>
                    </div>
                </div>

                {/* Vote Buttons */}
                {poll.userVotes < maxVotes ? (
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleVoteSelect('yes')}
                                disabled={isVoting}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-b from-green-500 to-green-700 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                            >
                                👍 YES
                            </button>
                            <button
                                onClick={() => handleVoteSelect('no')}
                                disabled={isVoting}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-b from-red-500 to-red-700 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                👎 NO
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">
                                Next vote costs: <span className="text-yellow-400 font-bold">{nextVoteCost?.toFixed(2)} WLD</span>
                            </p>
                            <p className="text-[10px] text-gray-600">
                                {poll.userVotes}/{maxVotes} votes used
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-3 text-sm text-gray-400 bg-white/5 rounded-xl">
                        ✅ Maximum votes reached (10/10)
                    </div>
                )}
            </motion.div>

            {/* Price Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm mt-6 bg-white/5 rounded-xl p-4 border border-white/5"
            >
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Vote Pricing</h4>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <div
                            key={n}
                            className={`flex justify-between p-1.5 rounded ${n <= poll.userVotes
                                ? 'bg-purple-500/10 text-purple-400'
                                : n === nextVoteNumber
                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    : 'text-gray-500'
                                }`}
                        >
                            <span>Vote #{n}</span>
                            <span className="font-bold">{getVoteCost(n).toFixed(2)} WLD</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Vote Confirmation Modal */}
            <AnimatePresence>
                {showVoteConfirm && selectedVote && nextVoteCost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => !isVoting && setShowVoteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1040] border border-purple-500/30 rounded-2xl p-6 max-w-xs w-full text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-3xl mb-3">{selectedVote === 'yes' ? '👍' : '👎'}</p>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Confirm Vote: {selectedVote.toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                This will cost <span className="text-yellow-400 font-bold">{nextVoteCost.toFixed(2)} WLD</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowVoteConfirm(false)}
                                    disabled={isVoting}
                                    className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVoteConfirm}
                                    disabled={isVoting}
                                    className={`flex-1 py-2 rounded-lg font-bold text-white text-sm transition-all ${selectedVote === 'yes'
                                        ? 'bg-green-600 hover:bg-green-500'
                                        : 'bg-red-600 hover:bg-red-500'
                                        } disabled:opacity-50`}
                                >
                                    {isVoting ? '...' : `Pay & Vote`}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
