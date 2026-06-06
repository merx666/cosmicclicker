import React, { useState, useRef, useEffect } from 'react'

interface VoidCaptchaModalProps {
    isOpen: boolean
    onSuccess: () => void
    onFailure: () => void
}

export default function VoidCaptchaModal({ isOpen, onSuccess, onFailure }: VoidCaptchaModalProps) {
    const [targetMin] = useState(() => 55 + Math.floor(Math.random() * 15)) // Losowa strefa od 55-70%
    const [targetMax] = useState(() => targetMin + 15) // Szerokość strefy 15%
    const [sliderValue, setSliderValue] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [timeLeft, setTimeLeft] = useState(30) // 30 sekund na rozwiązanie

    const trackRef = useRef<HTMLDivElement>(null)
    const dragPathRef = useRef<{ x: number; y: number; time: number }[]>([])

    // Odliczanie czasu
    useEffect(() => {
        if (!isOpen) return
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onFailure()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen, onFailure])

    if (!isOpen) return null

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(true)
        dragPathRef.current = [{ x: clientX, y: clientY, time: Date.now() }]
    }

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDragging || !trackRef.current) return
        
        const rect = trackRef.current.getBoundingClientRect()
        const width = rect.width
        const offsetX = Math.max(0, Math.min(width, clientX - rect.left))
        const pct = Math.round((offsetX / width) * 100)
        
        setSliderValue(pct)
        dragPathRef.current.push({ x: clientX, y: clientY, time: Date.now() })
    }

    const handleEnd = () => {
        if (!isDragging) return
        setIsDragging(false)

        // 1. Walidacja strefy docelowej
        const isWithinRange = sliderValue >= targetMin && sliderValue <= targetMax

        if (!isWithinRange) {
            handleFailedAttempt('Zły zakres suwaka')
            return
        }

        // 2. Walidacja analityki ruchu (anty-bot ścieżka)
        const path = dragPathRef.current
        if (path.length < 10) {
            handleFailedAttempt('Ruch zbyt krótki')
            return
        }

        // Obliczamy wariancję pozycji Y i odchylenia czasowe
        let totalDY = 0
        let maxDY = 0
        for (let i = 1; i < path.length; i++) {
            const dy = Math.abs(path[i].y - path[i-1].y)
            totalDY += dy
            if (dy > maxDY) maxDY = dy
        }

        // Człowiek ma naturalne mikrodrgania na osi Y podczas przeciągania suwaka w poziomie.
        // Jeśli wariancja Y jest idealnie równa 0 (ruch po idealnej linii prostej Y), to jest to bot.
        if (totalDY === 0) {
            handleFailedAttempt('Wykryto nieludzki ruch (wariancja Y)')
            return
        }

        // Jeśli weryfikacja przeszła pomyślnie
        onSuccess()
    }

    const handleFailedAttempt = (reason: string) => {
        console.warn(`[Captcha] Failed attempt: ${reason}`)
        setAttempts((prev) => {
            const next = prev + 1
            if (next >= 3) {
                onFailure()
            } else {
                setSliderValue(0)
            }
            return next
        })
    }

    // Handlery myszy
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY)
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUp = () => handleEnd()

    // Handlery dotyku
    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchEnd = () => handleEnd()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md p-6 border rounded-2xl bg-slate-900/90 border-slate-700/60 shadow-2xl text-slate-100">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wider text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-full uppercase animate-pulse">
                        ⚠️ Wykryto Anomalię (Void Shield)
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">Potwierdź, że jesteś człowiekiem</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Aby kontynuować zbieranie cząsteczek, ukończ kalibrację suwaka.
                    </p>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-2 mb-6 text-xs rounded-lg bg-slate-950/40 border border-slate-800/40">
                    <span className="text-slate-400">
                        Pozostały czas: <strong className="text-amber-400">{timeLeft}s</strong>
                    </span>
                    <span className="text-slate-400">
                        Próby: <strong className="text-rose-400">{attempts}/3</strong>
                    </span>
                </div>

                {/* Captcha Area */}
                <div className="relative p-6 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    
                    {/* Target Visual Range */}
                    <div className="relative h-12 mb-4 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                        {/* Target Area Overlay */}
                        <div 
                            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-400 tracking-wider uppercase animate-pulse"
                            style={{ left: `${targetMin}%`, right: `${100 - targetMax}%` }}
                        >
                            Cel
                        </div>
                        {/* Current position marker */}
                        <div 
                            className="absolute top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_8px_#8b5cf6]"
                            style={{ left: `${sliderValue}%` }}
                        />
                    </div>

                    {/* Drag Track */}
                    <div 
                        ref={trackRef}
                        className="relative h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-start px-1 select-none cursor-pointer"
                        onMouseMove={onMouseMove}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onTouchMove={onTouchMove}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* Slider Handle */}
                        <div 
                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform duration-75 select-none active:scale-95 ${
                                isDragging 
                                    ? 'bg-violet-600 shadow-violet-500/50 cursor-grabbing' 
                                    : 'bg-slate-800 hover:bg-slate-700 cursor-grab text-slate-300'
                            }`}
                            style={{ 
                                left: `calc(${sliderValue}% - ${sliderValue * 0.32}px)`,
                                transform: isDragging ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            ⇄
                        </div>
                        <div className="w-full text-center text-xs font-semibold text-slate-500 pointer-events-none select-none">
                            Przeciągnij suwak w strefę celu
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-[10px] text-slate-500">
                    Zabezpieczenie Void Bastion Protection v1.2
                </div>
            </div>
        </div>
    )
}
