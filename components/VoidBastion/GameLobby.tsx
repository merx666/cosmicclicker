import React from 'react';
import { useTranslation } from '@/lib/i18n';

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
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 24px 140px 24px',
            position: 'relative',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(93,0,255,0.18) 0%, rgba(188,19,254,0.06) 40%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
            }} />

            {/* Title */}
            <h1 style={{
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '4px',
                background: 'linear-gradient(135deg, #e0e0ff 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '28px',
                textTransform: 'uppercase',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
            }}>
                VOID BASTION
            </h1>

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                width: '100%',
                maxWidth: '340px',
                marginBottom: '32px',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(93,0,255,0.10) 0%, rgba(139,92,246,0.05) 100%)',
                    border: '1px solid rgba(139,92,246,0.22)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: '30px',
                        fontWeight: 800,
                        color: '#e0e0ff',
                        marginBottom: '6px',
                        lineHeight: 1,
                    }}>
                        {highestWave}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontWeight: 600,
                    }}>
                        {t('lobby.highest_wave')}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(93,0,255,0.10) 0%, rgba(139,92,246,0.05) 100%)',
                    border: '1px solid rgba(139,92,246,0.22)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: '30px',
                        fontWeight: 800,
                        color: '#e0e0ff',
                        marginBottom: '6px',
                        lineHeight: 1,
                    }}>
                        {formatNumber(totalCredits)}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontWeight: 600,
                    }}>
                        {t('lobby.credits')}
                    </div>
                </div>
            </div>

            {/* Central Play Button */}
            <button
                onClick={onPlay}
                style={{
                    position: 'relative',
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5d00ff 0%, #bc13fe 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(93,0,255,0.5), 0 0 80px rgba(188,19,254,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
                    marginBottom: '28px',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    flexShrink: 0,
                    zIndex: 1,
                }}
            >
                <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '50%',
                    background: 'rgba(10,4,21,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '36px', marginBottom: '4px', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.5))' }}>⚔️</span>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                    }}>{t('lobby.play')}</span>
                </div>

                <div style={{
                    position: 'absolute',
                    inset: '-6px',
                    borderRadius: '50%',
                    border: '2px solid rgba(139,92,246,0.3)',
                    animation: 'pulseRing 3s ease-in-out infinite',
                }} />
            </button>

            {/* Quick Actions Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                width: '100%',
                maxWidth: '340px',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: '14px',
                    padding: '14px 8px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏆</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px' }}>Season 1</div>
                </div>
                <div
                    onClick={onDailyClick}
                    style={{
                        background: 'rgba(234,179,8,0.06)',
                        border: '1px solid rgba(234,179,8,0.15)',
                        borderRadius: '14px',
                        padding: '14px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎁</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px' }}>Daily</div>
                </div>
                <div
                    onClick={() => window.open('https://x.com/Void_WorldApp', '_blank')}
                    style={{
                        background: 'rgba(34,197,94,0.06)',
                        border: '1px solid rgba(34,197,94,0.15)',
                        borderRadius: '14px',
                        padding: '14px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>𝕏</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px' }}>Follow</div>
                </div>
            </div>

            {/* Game mode info */}
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <p style={{
                    fontSize: '13px',
                    color: '#a78bfa',
                    fontWeight: 600,
                    marginBottom: '6px',
                }}>
                    {t('lobby.mode')}
                </p>
                <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: 1.5,
                    maxWidth: '280px',
                }}>
                    {t('lobby.mode_desc')}
                </p>
            </div>

            <style>{`
                @keyframes pulseRing {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.12); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
