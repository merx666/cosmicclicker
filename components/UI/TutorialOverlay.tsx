'use client'

import { X, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface TutorialOverlayProps {
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

const TUTORIAL_STEPS = [
    {
        title: 'Witaj w Void Bastion!',
        description: 'Twoja misja: Obroń swoją bazę przed falami wrogów używając taktycznych jednostek.',
        highlight: null
    },
    {
        title: 'Sklep Jednostek',
        description: 'Kliknij przycisk 🛒 BUY UNITS aby kupić nowe jednostki. Każda ma unikalne statystyki!',
        highlight: 'shop'
    },
    {
        title: 'Rezerwa (RESERVE)',
        description: 'Kupione jednostki trafiają do rezerwy. Przeciągnij je na planszę aby mogły walczyć!',
        highlight: 'bench'
    },
    {
        title: 'Plansza Bojowa',
        description: 'Rozmieść jednostki na planszy. Im lepsze ustawienie, tym większa szansa na zwycięstwo!',
        highlight: 'board'
    },
    {
        title: 'Rozpocznij Walkę!',
        description: 'Gdy jesteś gotowy, kliknij ⚔️ START COMBAT. Twoje jednostki automatycznie zaatakują wrogów!',
        highlight: 'combat'
    }
]

export default function TutorialOverlay({ isOpen, onClose, onComplete }: TutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0)

    if (!isOpen) return null

    const step = TUTORIAL_STEPS[currentStep]
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

    const handleNext = () => {
        if (isLastStep) {
            onComplete()
            onClose()
        } else {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleSkip = () => {
        onComplete()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            {/* Highlight effect based on step */}
            {step.highlight === 'shop' && (
                <div className="absolute bottom-20 left-4 w-40 h-24 border-4 border-neon-blue rounded-lg animate-pulse pointer-events-none" />
            )}
            {step.highlight === 'bench' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 h-24 border-4 border-neon-pink rounded-lg animate-pulse pointer-events-none" />
            )}
            {step.highlight === 'board' && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-96 border-4 border-neon-green rounded-lg animate-pulse pointer-events-none" />
            )}
            {step.highlight === 'combat' && (
                <div className="absolute bottom-20 right-4 w-44 h-24 border-4 border-neon-green rounded-lg animate-pulse pointer-events-none" />
            )}

            {/* Tutorial Card */}
            <div className="glass-panel max-w-lg w-full border-2 border-neon-pink rounded-2xl p-8 relative">
                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                >
                    <X size={24} />
                </button>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-6">
                    {TUTORIAL_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentStep
                                    ? 'bg-neon-pink w-8'
                                    : idx < currentStep
                                        ? 'bg-neon-pink/50'
                                        : 'bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-cyber font-bold text-neon-pink mb-4">
                        {step.title}
                    </h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    {currentStep > 0 && (
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="glass-button px-6 py-3 border-gray-500 text-gray-400 hover:bg-gray-800/50"
                        >
                            Wstecz
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 bg-neon-pink/20 border-2 border-neon-pink text-neon-pink py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-neon-pink/30 hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        {isLastStep ? 'Zaczynajmy!' : 'Dalej'}
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Skip Option */}
                {!isLastStep && (
                    <button
                        onClick={handleSkip}
                        className="w-full mt-4 text-sm text-gray-500 hover:text-gray-300 transition"
                    >
                        Pomiń tutorial
                    </button>
                )}
            </div>
        </div>
    )
}
