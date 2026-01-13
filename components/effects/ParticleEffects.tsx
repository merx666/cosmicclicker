'use client'

import { motion } from 'framer-motion'

interface ParticleEffectsProps {
    skinType: 'default' | 'rainbow' | 'gold'
    isClicking: boolean
    isLucky: boolean
}

export default function ParticleEffects({ skinType, isClicking, isLucky }: ParticleEffectsProps) {
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

    // Default - no extra effects
    return null
}
