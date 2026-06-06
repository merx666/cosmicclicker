'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ParticleEffectsProps {
    skinType: 'default' | 'rainbow' | 'gold' | 'crystal' | 'dark_matter' | 'supernova'
    isClicking: boolean
    isLucky: boolean
}

export default function ParticleEffects({ skinType, isClicking, isLucky }: ParticleEffectsProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    // Rainbow effects
    if (skinType === 'rainbow') {
        return (
            <div className="absolute inset-0 pointer-events-none">
                {/* Animated hue rotation gradient overlay */}
                <motion.div
                    className="absolute inset-0 rounded-full opacity-30"
                    animate={{
                        background: [
                            'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ff0080)',
                            'linear-gradient(135deg, #40e0d0, #ff0080, #ff8c00, #40e0d0)',
                            'linear-gradient(225deg, #ff8c00, #40e0d0, #ff0080, #ff8c00)',
                            'linear-gradient(315deg, #ff0080, #ff8c00, #40e0d0, #ff0080)',
                        ],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Rainbow stars around particle */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: Math.cos((i * Math.PI * 2) / 6 + Date.now() / 1000) * 140,
                            y: Math.sin((i * Math.PI * 2) / 6 + Date.now() / 1000) * 140,
                            opacity: [0.4, 0.8, 0.4],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 rounded-full blur-sm" />
                    </motion.div>
                ))}

                {/* Rainbow explosion on lucky */}
                {isLucky && (
                    <>
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={`lucky-${i}`}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    background: `hsl(${i * 30}, 100%, 60%)`,
                                }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 12) * 200,
                                    y: Math.sin((i * Math.PI * 2) / 12) * 200,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        ))}
                    </>
                )}
            </div>
        )
    }

    // Golden effects
    if (skinType === 'gold') {
        return (
            <div className="absolute inset-0 pointer-events-none">
                {/* Golden sparkles orbiting */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: Math.cos((i * Math.PI * 2) / 8 + Date.now() / 800) * 120,
                            y: Math.sin((i * Math.PI * 2) / 8 + Date.now() / 800) * 120,
                            opacity: [0.3, 1, 0.3],
                            scale: [0.5, 1.5, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    >
                        <div className="w-full h-full bg-yellow-300 rounded-full shadow-[0_0_10px_#ffd700]" />
                    </motion.div>
                ))}

                {/* Golden flash on click */}
                {isClicking && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-200/60 to-transparent"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}

                {/* Coin flip animation on lucky */}
                {isLucky && (
                    <motion.div
                        className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16"
                        initial={{ rotateY: 0, y: 0 }}
                        animate={{
                            rotateY: [0, 180, 360, 540, 720],
                            y: [0, -100, -150, -100, 0],
                        }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_0_30px_#ffd700] flex items-center justify-center text-2xl">
                            💰
                        </div>
                    </motion.div>
                )}

                {/* Golden flares */}
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={`flare-${i}`}
                        className="absolute w-1 h-20 bg-gradient-to-b from-yellow-200/0 via-yellow-300/60 to-yellow-200/0"
                        style={{
                            left: '50%',
                            top: '50%',
                            originX: 0.5,
                            originY: 0.5,
                            rotate: i * 45,
                        }}
                        animate={{
                            opacity: [0.2, 0.6, 0.2],
                            scaleY: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </div>
        )
    }

    // Crystal effects
    if (skinType === 'crystal') {
        return (
            <div className="absolute inset-0 pointer-events-none">
                {/* Crystal sparkles orbiting */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-br from-cyan-200 to-sky-400"
                        style={{
                            left: '50%',
                            top: '50%',
                            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond shape
                        }}
                        animate={{
                            x: Math.cos((i * Math.PI * 2) / 6 + Date.now() / 900) * 130,
                            y: Math.sin((i * Math.PI * 2) / 6 + Date.now() / 900) * 130,
                            rotate: 360,
                            opacity: [0.4, 0.9, 0.4],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.15,
                        }}
                    />
                ))}

                {/* Cyan flash on click */}
                {isClicking && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-300/40 to-transparent"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}

                {/* Shard burst on lucky */}
                {isLucky && (
                    <>
                        {[...Array(10)].map((_, i) => (
                            <motion.div
                                key={`shard-${i}`}
                                className="absolute w-2 h-4 bg-cyan-300 rounded-sm"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: i * 36 }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 10) * 180,
                                    y: Math.sin((i * Math.PI * 2) / 10) * 180,
                                    scale: 0,
                                    opacity: 0,
                                    rotate: i * 36 + 180,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        ))}
                    </>
                )}
            </div>
        )
    }

    // Dark Matter effects
    if (skinType === 'dark_matter') {
        return (
            <div className="absolute inset-0 pointer-events-none">
                {/* Black-purple gravitational rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute left-1/2 top-1/2 -ml-16 -mt-16 w-32 h-32 rounded-full border border-dashed border-purple-950"
                        style={{
                            boxShadow: 'inset 0 0 20px rgba(109, 40, 217, 0.1)',
                        }}
                        animate={{
                            rotate: i % 2 === 0 ? 360 : -360,
                            scale: [1, 1.1 + i * 0.15, 1],
                        }}
                        transition={{
                            duration: 4 + i * 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}

                {/* Vortex shadows orbiting */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-3.5 h-3.5 bg-gradient-radial from-purple-900 to-black rounded-full blur-[1px]"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: Math.cos((i * Math.PI * 2) / 5 - Date.now() / 1200) * 125,
                            y: Math.sin((i * Math.PI * 2) / 5 - Date.now() / 1200) * 125,
                            opacity: [0.3, 0.7, 0.3],
                            scale: [0.7, 1.1, 0.7],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}

                {/* Gravitational pull implosion on click */}
                {isClicking && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-purple-900/30 bg-purple-950/5"
                        initial={{ scale: 1.6, opacity: 0.8 }}
                        animate={{ scale: 0.7, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeIn" }}
                    />
                )}

                {/* Imploding dark matter particles on lucky */}
                {isLucky && (
                    <>
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={`implode-${i}`}
                                className="absolute w-2 h-2 rounded-full bg-violet-800"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                }}
                                initial={{
                                    x: Math.cos((i * Math.PI * 2) / 12) * 220,
                                    y: Math.sin((i * Math.PI * 2) / 12) * 220,
                                    scale: 0.5,
                                    opacity: 0,
                                }}
                                animate={{
                                    x: 0,
                                    y: 0,
                                    scale: 1.5,
                                    opacity: [0, 1, 0],
                                }}
                                transition={{ duration: 0.9, ease: "easeIn" }}
                            />
                        ))}
                    </>
                )}
            </div>
        )
    }

    // Supernova effects
    if (skinType === 'supernova') {
        return (
            <div className="absolute inset-0 pointer-events-none">
                {/* Solar sparks orbiting */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: Math.cos((i * Math.PI * 2) / 10 + Date.now() / 600) * 135,
                            y: Math.sin((i * Math.PI * 2) / 10 + Date.now() / 600) * 135,
                            opacity: [0.4, 1, 0.4],
                            scale: [0.6, 1.4, 0.6],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.08,
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-r from-red-500 to-yellow-400 rounded-full shadow-[0_0_8px_#f97316]" />
                    </motion.div>
                ))}

                {/* Mini explosion on click */}
                {isClicking && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-radial from-orange-400/50 via-red-500/10 to-transparent"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}

                {/* Massive supernova burst on lucky */}
                {isLucky && (
                    <>
                        <motion.div
                            className="absolute left-1/2 top-1/2 -ml-20 -mt-20 w-40 h-40 rounded-full bg-gradient-radial from-yellow-300 via-orange-500/30 to-transparent blur-md"
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                        {[...Array(16)].map((_, i) => (
                            <motion.div
                                key={`burst-${i}`}
                                className="absolute w-2.5 h-2.5 rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    background: i % 2 === 0 ? '#f59e0b' : '#ef4444',
                                }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 16) * 220,
                                    y: Math.sin((i * Math.PI * 2) / 16) * 220,
                                    scale: 0.2,
                                    opacity: 0,
                                }}
                                transition={{ duration: 1.1, ease: "easeOut" }}
                            />
                        ))}
                    </>
                )}
            </div>
        )
    }

    // Default - no extra effects
    return null
}
