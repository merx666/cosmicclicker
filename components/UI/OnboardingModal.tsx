'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface OnboardingModalProps {
    onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0)

    const steps = [
        {
            title: "Welcome to Void Tactics!",
            description: "A strategic auto-battler where you build and upgrade your army to conquer waves of enemies.",
            icon: ""
        },
        {
            title: "Build Your Army 🛒",
            description: "Use credits to buy units. Drag units onto the board to position them strategically.",
            icon: ""
        },
        {
            title: "Merge to Upgrade",
            description: "Combine 3 units of the same type to create a stronger 2-star unit. Merge again for 3-star!",
            icon: ""
        },
        {
            title: "Synergies & Traits 💎",
            description: "Match unit types to activate powerful synergy bonuses that boost your entire army.",
            icon: ""
        },
        {
            title: "Start Combat!",
            description: "When ready, click 'START COMBAT' and watch your units fight automatically. Good luck!",
            icon: ""
        }
    ]

    const currentStepData = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    const handleNext = () => {
        if (isLastStep) {
            localStorage.setItem('void_onboarding_seen', 'true')
            onClose()
        } else {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleSkip = () => {
        localStorage.setItem('void_onboarding_seen', 'true')
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleSkip}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-indigo-500/30 shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

                {/* Step indicator */}
                <div className="flex justify-center gap-2 mb-6">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep
                                ? 'w-8 bg-indigo-500'
                                : index < currentStep
                                    ? 'w-4 bg-indigo-700'
                                    : 'w-4 bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Icon */}
                <motion.div
                    key={currentStep}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="text-6xl text-center mb-6"
                >
                    {currentStepData.icon}
                </motion.div>

                {/* Content */}
                <motion.div
                    key={`content-${currentStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-white text-center mb-4">
                        {currentStepData.title}
                    </h2>
                    <p className="text-slate-300 text-center leading-relaxed mb-8">
                        {currentStepData.description}
                    </p>
                </motion.div>

                {/* Buttons */}
                <div className="flex gap-3">
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                        >
                            Skip
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
                    >
                        {isLastStep ? "Let's Play!" : 'Next'}
                    </button>
                </div>

                {/* Step counter */}
                <p className="text-center text-slate-500 text-sm mt-4">
                    {currentStep + 1} of {steps.length}
                </p>
            </motion.div>
        </motion.div>
    )
}
