import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
    userName?: string;
    isVerified?: boolean;
    onBackToMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName = "Void Bastion", isVerified = false, onBackToMenu }) => {
    return (
        <header className="sticky top-0 z-40 bg-[#0a0415]/90 backdrop-blur-md border-b border-purple-500/15 flex-shrink-0 pt-[env(safe-area-inset-top)]">
            <div className="w-full max-w-[430px] mx-auto px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onBackToMenu && (
                            <motion.button
                                onClick={onBackToMenu}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/5 border border-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wider uppercase cursor-pointer hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
                            >
                                <span className="mr-1">←</span> Back
                            </motion.button>
                        )}
                        <h1 className="text-lg font-black tracking-widest bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent uppercase m-0">
                            Void Bastion
                        </h1>
                        {isVerified && (
                            <span className="text-[9px] text-emerald-400 font-extrabold tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                                VERIFIED
                            </span>
                        )}
                    </div>
                    {/* Season badge */}
                    <div className="px-3.5 py-1 rounded-full bg-purple-900/20 border border-purple-500/20 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.05)]">
                        <span className="text-xs">🏆</span>
                        <span className="font-black text-[10px] text-purple-300 tracking-wider uppercase">
                            S1
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};
