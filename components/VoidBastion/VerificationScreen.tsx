import React from 'react';
import { MobileLayout } from './MobileLayout';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface VerificationScreenProps {
    onVerify: () => void;
    isLoading?: boolean;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ onVerify, isLoading }) => {
    const { t } = useTranslation();

    return (
        <MobileLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden select-none min-h-dvh">
                {/* Animated gradient orb */}
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(93,0,255,0.22)_0%,rgba(188,19,254,0.08)_40%,transparent_70%)] filter blur-3xl pointer-events-none" />

                {/* Animated Stars */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                            style={{
                                width: i % 3 === 0 ? '3px' : '2px',
                                height: i % 3 === 0 ? '3px' : '2px',
                                left: `${10 + (i * 37) % 80}%`,
                                top: `${8 + (i * 29) % 80}%`,
                            }}
                            animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.3, 1] }}
                            transition={{ duration: 2 + (i % 3) * 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    ))}
                </div>

                {/* Logo Section */}
                <div className="mb-10 flex flex-col items-center relative z-10">
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-5 shadow-[0_4px_30px_rgba(93,0,255,0.35),0_0_60px_rgba(188,19,254,0.15)] border border-white/15"
                    >
                        <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">⚔️</span>
                    </motion.div>

                    <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-purple-300 via-fuchsia-100 to-indigo-300 bg-clip-text text-transparent mb-2 uppercase text-center">
                        {t('verification.title')}
                    </h1>
                    <p className="text-xs text-purple-400 font-bold tracking-[0.25em] uppercase text-center opacity-80">
                        {t('verification.subtitle')}
                    </p>
                </div>

                {/* Verification Card */}
                <div className="w-full max-w-[340px] bg-gradient-to-br from-[#12072b]/80 to-[#0a0418]/60 border border-purple-500/25 rounded-3xl p-7 backdrop-blur-lg shadow-[0_12px_40px_rgba(139,92,246,0.08)] relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl">🔐</span>
                    </div>

                    <h2 className="text-base font-bold text-white text-center mb-2">
                        {t('verification.worldid_title')}
                    </h2>
                    <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                        {t('verification.worldid_desc')}
                    </p>

                    <motion.button
                        onClick={onVerify}
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:via-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(93,0,255,0.35),0_0_40px_rgba(188,19,254,0.15)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>{t('verification.verifying')}</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                <span>{t('verification.verify_btn')}</span>
                            </>
                        )}
                    </motion.button>

                    <div className="mt-6 pt-5 border-t border-purple-500/15">
                        <div className="flex flex-col gap-1.5 items-center">
                            <p className="text-[10px] text-gray-500 text-center leading-normal">
                                {t('verification.secure')}
                            </p>
                            <p className="text-[10px] text-purple-400/60 text-center font-medium hover:text-purple-400 transition-colors cursor-pointer">
                                {t('verification.privacy')}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-[10px] text-gray-600 text-center max-w-[240px] leading-relaxed">
                    {t('verification.required')}
                </p>
            </div>
        </MobileLayout>
    );
};
