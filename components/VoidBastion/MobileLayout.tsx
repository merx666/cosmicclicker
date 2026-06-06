import React from 'react';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div style={{
            width: '100%',
            minHeight: '100dvh',
            background: '#0a0415',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '430px',
                minHeight: '100dvh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: '#0a0415',
            }}>
                {/* Background grid + radial glow */}
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    opacity: 0.12,
                    pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(107,47,181,0.35) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 24px 24px, 24px 24px',
                }} />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
};
