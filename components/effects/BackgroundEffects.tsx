'use client'

import { motion } from 'framer-motion'

interface BackgroundEffectsProps {
    theme: 'default' | 'nebula' | 'galaxy'
}

export default function BackgroundEffects({ theme }: BackgroundEffectsProps) {
    // Nebula theme effects
    if (theme === 'nebula') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Twinkling stars */}
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}

                {/* Shooting stars */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`shooting-${i}`}
                        className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
                        style={{
                            left: `-10%`,
                            top: `${20 + i * 30}%`,
                        }}
                        animate={{
                            x: ['0vw', '120vw'],
                            y: ['0vh', '40vh'],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 8 + 5,
                            repeatDelay: 18,
                        }}
                    />
                ))}

                {/* Purple nebula particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`nebula-${i}`}
                        className="absolute rounded-full bg-purple-500/20 blur-xl"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${50 + Math.random() * 150}px`,
                            height: `${50 + Math.random() * 150}px`,
                        }}
                        animate={{
                            x: [0, Math.random() * 50 - 25, 0],
                            y: [0, Math.random() * 50 - 25, 0],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Parallax nebula movement overlay */}
                <motion.div
                    className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        )
    }

    // Galaxy theme effects
    if (theme === 'galaxy') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Spiraling stars */}
                {[...Array(30)].map((_, i) => {
                    const angle = (i / 30) * Math.PI * 4 // 2 full rotations
                    const radius = 20 + (i / 30) * 40 // Spiral outward

                    return (
                        <motion.div
                            key={`spiral-${i}`}
                            className="absolute w-1 h-1 bg-blue-200 rounded-full"
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            animate={{
                                x: Math.cos(angle + Date.now() / 5000) * radius + '%',
                                y: Math.sin(angle + Date.now() / 5000) * radius + '%',
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                delay: i * 0.05,
                            }}
                        />
                    )
                })}

                {/* Cosmic dust particles */}
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={`dust-${i}`}
                        className="absolute w-0.5 h-0.5 bg-indigo-300/40 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50],
                            y: [0, Math.random() * 100 - 50],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Glow pulses */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={`glow-${i}`}
                        className="absolute rounded-full bg-indigo-500/10 blur-3xl"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 2) * 40}%`,
                            width: '300px',
                            height: '300px',
                        }}
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            delay: i * 1.5,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Rotating galactic arms */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -ml-[50vw] -mt-[50vh] w-[100vw] h-[100vh]"
                    animate={{
                        rotate: 360,
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    {[0, 120, 240].map((angle) => (
                        <div
                            key={angle}
                            className="absolute left-1/2 top-1/2 w-[80%] h-[2px] origin-left"
                            style={{
                                transform: `rotate(${angle}deg)`,
                                background: 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.2), transparent)',
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        )
    }

    // Default - no extra effects
    return null
}
