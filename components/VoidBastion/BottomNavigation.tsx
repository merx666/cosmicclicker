import React from 'react';
import { ShieldIcon, ChartIcon, PeopleIcon } from '@/components/UI/Icons';
import { t } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface BottomNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onPlay: () => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const BookIcon = ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
    </svg>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, onPlay }) => {
    const tabs: NavItem[] = [
        { id: 'armory', label: t('nav.armory'), icon: <ShieldIcon size={20} /> },
        { id: 'guide', label: t('nav.guide'), icon: <BookIcon size={20} /> },
        { id: 'multiplayer', label: 'SOON', icon: <PeopleIcon size={22} /> },
        { id: 'ranks', label: t('nav.ranking'), icon: <ChartIcon size={20} /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0415]/95 backdrop-blur-lg border-t border-purple-500/15 z-50 pb-[env(safe-area-inset-bottom,16px)]">
            <div className="max-w-[430px] mx-auto flex items-end justify-around px-1 py-1 relative">
                {/* Left tabs */}
                <NavButton item={tabs[0]} isActive={activeTab === 'armory'} onClick={() => onTabChange('armory')} />
                <NavButton item={tabs[1]} isActive={activeTab === 'guide'} onClick={() => onTabChange('guide')} />

                {/* Center Play Button */}
                <div className="relative top-[-14px] mx-1">
                    <motion.button
                        onClick={onPlay}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-[1px] cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3),0_4px_12px_rgba(0,0,0,0.4)] relative z-20 flex items-center justify-center"
                    >
                        <div className="w-full h-full rounded-[15px] bg-[#0a0415]/80 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center hover:bg-black/40 transition-colors">
                            <span className="text-xl mb-0.5 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">⚔️</span>
                            <span className="text-[8px] font-black text-white tracking-[0.15em] uppercase">{t('lobby.play')}</span>
                        </div>
                    </motion.button>
                    {/* Shadow glow under the center play button */}
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-10 h-2 bg-purple-600/30 blur-[6px] rounded-full" />
                </div>

                {/* Right tabs */}
                <NavButton item={tabs[2]} isActive={activeTab === 'multiplayer'} isDisabled onClick={() => onTabChange('multiplayer')} />
                <NavButton item={tabs[3]} isActive={activeTab === 'ranks'} onClick={() => onTabChange('ranks')} />
            </div>
        </nav>
    );
};

interface NavButtonProps {
    item: NavItem;
    isActive: boolean;
    isDisabled?: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, isDisabled = false, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={isDisabled ? {} : { scale: 0.92 }}
        className={`flex flex-col items-center justify-center gap-1 py-2 px-2.5 rounded-xl border-none cursor-pointer min-w-[58px] min-h-[44px] transition-all ${
            isActive && !isDisabled 
                ? 'bg-purple-500/10 text-purple-300' 
                : 'bg-transparent text-gray-500 hover:text-gray-300'
        } ${isDisabled ? 'opacity-40 cursor-default pointer-events-none' : ''}`}
    >
        <div className={`transition-transform duration-200 ${isActive && !isDisabled ? 'scale-110 filter drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]' : 'scale-100'}`}>
            {item.icon}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider ${isActive && !isDisabled ? 'text-purple-300' : 'text-gray-500'}`}>
            {item.label}
        </span>
    </motion.button>
);
