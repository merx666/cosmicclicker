import React from 'react';
import { useTranslation } from '@/lib/i18n';

interface HeaderProps {
    userName?: string;
    isVerified?: boolean;
    onBackToMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName = "Void Bastion", isVerified = false, onBackToMenu }) => {
    const { t } = useTranslation();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'rgba(10,4,21,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(139,92,246,0.15)',
            flexShrink: 0,
        }}>
            <div style={{
                maxWidth: '430px',
                margin: '0 auto',
                padding: '16px 20px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {onBackToMenu && (
                            <button
                                onClick={onBackToMenu}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    borderRadius: '8px',
                                    color: '#a78bfa',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: '5px 9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    letterSpacing: '1px',
                                    marginRight: '2px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                ◀ Back
                            </button>
                        )}
                        <h1 style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            letterSpacing: '2px',
                            background: 'linear-gradient(135deg, #a78bfa 0%, #bc13fe 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0,
                        }}>
                            VOID BASTION
                        </h1>
                        {isVerified && (
                            <span style={{
                                fontSize: '9px',
                                color: '#4ade80',
                                fontWeight: 700,
                                letterSpacing: '1.5px',
                                background: 'rgba(74,222,128,0.1)',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: '1px solid rgba(74,222,128,0.2)',
                            }}>
                                VERIFIED
                            </span>
                        )}
                    </div>
                    {/* Season badge */}
                    <div style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(93,0,255,0.10)',
                        border: '1px solid rgba(139,92,246,0.20)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <span style={{ fontSize: '13px' }}>🏆</span>
                        <span style={{
                            fontWeight: 700,
                            fontSize: '11px',
                            color: '#c4b5fd',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}>
                            S1
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};
