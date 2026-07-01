import React from 'react';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="w-full min-h-dvh bg-void-dark text-white flex justify-center items-start">
            <div className="w-full max-w-[430px] min-h-dvh relative flex flex-col bg-void-dark">
                {/* Background grid + radial glow */}
                <div className="fixed inset-0 z-0 opacity-12 pointer-events-none bg-[radial-gradient(circle_at_50%_25%,rgba(107,47,181,0.35)_0%,transparent_50%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_100%,24px_24px,24px_24px]" />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="relative z-10 w-full flex-1 flex flex-col overflow-y-auto overflow-x-hidden"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
};
