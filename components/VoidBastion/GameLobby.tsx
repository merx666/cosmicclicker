import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface GameLobbyProps {
    highestWave: number;
    totalCredits: number;
    onPlay: () => void;
    onDailyClick?: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ highestWave = 0, totalCredits = 0, onPlay, onDailyClick }) => {
    const { t } = useTranslation();

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    };

    return (
        <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-32 relative overflow-y-auto no-scrollbar select-none">
            {/* Background glow */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(93,0,255,0.15)_0%,rgba(188,19,254,0.05)_40%,transparent_70%)] filter blur-3xl pointer-events-none" />

            {/* Title */}
            <h2 className="text-2xl font-black tracking-[0.2em] bg-gradient-to-r from-purple-300 via-fuchsia-100 to-indigo-300 bg-clip-text text-transparent mb-7 uppercase text-center relative z-10">
                Void Bastion
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3.5 w-full max-w-[340px] mb-8 relative z-10">
                <div className="bg-gradient-to-br from-purple-900/10 to-indigo-900/5 border border-purple-500/20 rounded-2xl p-5 text-center shadow-[0_8px_32px_0_rgba(139,92,246,0.03)] hover:border-purple-500/40 transition-colors duration-300">
                    <div className="text-3xl font-black text-purple-100 mb-1.5 leading-none">
                        {highestWave}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {t('lobby.highest_wave')}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/10 to-indigo-900/5 border border-purple-500/20 rounded-2xl p-5 text-center shadow-[0_8px_32px_0_rgba(139,92,246,0.03)] hover:border-purple-500/40 transition-colors duration-300">
                    <div className="text-3xl font-black text-purple-100 mb-1.5 leading-none">
                        {formatNumber(totalCredits)}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {t('lobby.credits')}
                    </div>
                </div>
            </div>

            {/* Central Play Button */}
            <div className="relative mb-8 flex-shrink-0 z-10 flex items-center justify-center">
                {/* Pulsing ring animation in background */}
                <motion.div
                    className="absolute w-[142px] h-[142px] rounded-full border border-purple-500/25 pointer-events-none"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.button
                    onClick={onPlay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-[130px] h-[130px] rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-fuchsia-600 p-[1.5px] cursor-pointer shadow-[0_0_40px_rgba(93,0,255,0.4),0_0_80px_rgba(188,19,254,0.15),inset_0_0_30px_rgba(0,0,0,0.3)] relative flex items-center justify-center"
                >
                    <div className="absolute inset-[3px] rounded-full bg-[#0a0415]/80 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center hover:bg-black/40 transition-colors">
                        <span className="text-[38px] mb-1 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">⚔️</span>
                        <span className="text-sm font-black text-white tracking-[0.2em] uppercase">{t('lobby.play')}</span>
                    </div>
                </motion.button>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[340px] mb-8 relative z-10">
                <div className="bg-purple-900/10 border border-purple-500/15 rounded-2xl py-3.5 px-2 text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                    <div className="text-xl mb-1">🏆</div>
                    <div className="text-[10px] text-purple-300 font-bold tracking-wider">Season 1</div>
                </div>
                
                <motion.div
                    onClick={onDailyClick}
                    whileTap={{ scale: 0.95 }}
                    className="bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 rounded-2xl py-3.5 px-2 text-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-colors duration-200"
                >
                    <div className="text-xl mb-1">🎁</div>
                    <div className="text-[10px] text-amber-300 font-bold tracking-wider">Daily</div>
                </motion.div>
                
                <motion.div
                    onClick={() => window.open('https://x.com/Void_WorldApp', '_blank')}
                    whileTap={{ scale: 0.95 }}
                    className="bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 rounded-2xl py-3.5 px-2 text-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-colors duration-200"
                >
                    <div className="text-xl mb-1">𝕏</div>
                    <div className="text-[10px] text-emerald-300 font-bold tracking-wider">Follow</div>
                </motion.div>
            </div>

            {/* Game mode info */}
            <div className="text-center max-w-[280px] relative z-10">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1.5">
                    {t('lobby.mode')}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                    {t('lobby.mode_desc')}
                </p>
            </div>
        </div>
    );
};
