'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface BackgroundEffectsProps {
    theme: 'default' | 'nebula' | 'galaxy' | 'supernova' | 'deep_space'
}

export default function BackgroundEffects({ theme }: BackgroundEffectsProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

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

    // Supernova theme effects
    if (theme === 'supernova') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-red-950/20 via-orange-950/20 to-black">
                {/* Expansive pulsing fire clouds */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`fire-cloud-${i}`}
                        className="absolute rounded-full bg-orange-600/10 blur-3xl"
                        style={{
                            left: `${10 + i * 20}%`,
                            top: `${20 + (i % 2) * 30}%`,
                            width: '400px',
                            height: '400px',
                        }}
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.1, 0.25, 0.1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{
                            duration: 12 + i * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Intense central solar flare pulse */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -ml-[250px] -mt-[250px] w-[500px] h-[500px] rounded-full bg-gradient-radial from-orange-500/20 via-red-500/5 to-transparent blur-2xl"
                    animate={{
                        scale: [0.9, 1.15, 0.9],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Rotating solar flares */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -ml-[50vw] -mt-[50vh] w-[100vw] h-[100vh]"
                    animate={{
                        rotate: -360,
                    }}
                    transition={{
                        duration: 45,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                        <div
                            key={angle}
                            className="absolute left-1/2 top-1/2 w-[70%] h-[3px] origin-left"
                            style={{
                                transform: `rotate(${angle}deg)`,
                                background: 'linear-gradient(to right, transparent, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.2), transparent)',
                            }}
                        />
                    ))}
                </motion.div>

                {/* Blazing sparks rising */}
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={`spark-${i}`}
                        className="absolute w-1.5 h-1.5 bg-gradient-to-t from-yellow-300 to-orange-500 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${90 + Math.random() * 10}%`,
                        }}
                        animate={{
                            y: ['0vh', '-110vh'],
                            x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                            opacity: [0, 1, 1, 0],
                            scale: [1, 1.5, 0.5],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 6,
                            repeat: Infinity,
                            delay: Math.random() * 8,
                            ease: "easeOut",
                        }}
                    />
                ))}
            </div>
        )
    }

    // Deep Space theme effects
    if (theme === 'deep_space') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-[#020617] via-[#0f172a] to-black">
                {/* Twinkling cyan & white stars */}
                {[...Array(60)].map((_, i) => (
                    <motion.div
                        key={`ds-star-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: i % 5 === 0 ? '3px' : '1px',
                            height: i % 5 === 0 ? '3px' : '1px',
                            background: i % 3 === 0 ? '#38bdf8' : '#ffffff',
                            boxShadow: i % 5 === 0 ? '0 0 8px #38bdf8' : 'none',
                        }}
                        animate={{
                            opacity: [0.15, 0.9, 0.15],
                            scale: [0.8, i % 5 === 0 ? 1.3 : 1.0, 0.8],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}

                {/* Slow floating cyan/blue nebulae */}
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={`ds-nebula-${i}`}
                        className="absolute rounded-full bg-cyan-600/5 blur-3xl"
                        style={{
                            left: `${Math.random() * 80}%`,
                            top: `${Math.random() * 80}%`,
                            width: '450px',
                            height: '450px',
                        }}
                        animate={{
                            x: [0, (Math.random() - 0.5) * 60, 0],
                            y: [0, (Math.random() - 0.5) * 60, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 15 + i * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Silent drifting dark stardust */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`ds-dust-${i}`}
                        className="absolute w-1 h-1 bg-sky-200/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: ['-5vw', '105vw'],
                            y: ['-5vh', '105vh'],
                            opacity: [0, 0.4, 0.4, 0],
                        }}
                        transition={{
                            duration: 25 + Math.random() * 15,
                            repeat: Infinity,
                            delay: Math.random() * 15,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>
        )
    }

    // Default - no extra effects
    return null
}
