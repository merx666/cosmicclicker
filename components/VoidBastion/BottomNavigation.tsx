import React from 'react';
import { ShieldIcon, ChartIcon, PeopleIcon } from '@/components/UI/Icons';
import { t } from '@/lib/i18n';

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

// Simple Book icon for Guide
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
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(10,4,21,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(139,92,246,0.15)',
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}>
            <div style={{
                maxWidth: '430px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '6px 4px 0',
                position: 'relative',
            }}>
                {/* Left tabs */}
                <NavButton item={tabs[0]} isActive={activeTab === 'armory'} onClick={() => onTabChange('armory')} />
                <NavButton item={tabs[1]} isActive={activeTab === 'guide'} onClick={() => onTabChange('guide')} />

                {/* Center Play Button */}
                <div style={{ position: 'relative', top: '-18px', margin: '0 2px' }}>
                    <button
                        onClick={onPlay}
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #5d00ff 0%, #bc13fe 100%)',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(93,0,255,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '14px',
                            background: 'rgba(0,0,0,0.45)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '22px', marginBottom: '1px' }}>⚔️</span>
                            <span style={{
                                fontSize: '8px',
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                            }}>{t('lobby.play')}</span>
                        </div>
                    </button>
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40px',
                        height: '10px',
                        background: 'rgba(93,0,255,0.35)',
                        filter: 'blur(10px)',
                        borderRadius: '50%',
                    }} />
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
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '8px 10px',
            borderRadius: '12px',
            border: 'none',
            background: isActive && !isDisabled ? 'rgba(139,92,246,0.12)' : 'transparent',
            cursor: isDisabled ? 'default' : 'pointer',
            minWidth: '54px',
            transition: 'all 0.2s',
            color: isDisabled ? '#3b3b4f' : isActive ? '#a78bfa' : '#6b7280',
            opacity: isDisabled ? 0.45 : 1,
        }}
    >
        <div style={{
            filter: isActive && !isDisabled ? 'drop-shadow(0 0 6px rgba(168,85,247,0.6))' : 'none',
            transform: isActive && !isDisabled ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s',
        }}>
            {item.icon}
        </div>
        <span style={{
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isDisabled ? '#3b3b4f' : isActive ? '#c4b5fd' : '#6b7280',
        }}>
            {item.label}
        </span>
    </button>
);
