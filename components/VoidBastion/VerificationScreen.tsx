import React from 'react';
import { MobileLayout } from './MobileLayout';
import { useTranslation } from '@/lib/i18n';

interface VerificationScreenProps {
    onVerify: () => void;
    isLoading?: boolean;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ onVerify, isLoading }) => {
    const { t } = useTranslation();

    return (
        <MobileLayout>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Animated gradient orb */}
                <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(93,0,255,0.25) 0%, rgba(188,19,254,0.1) 40%, transparent 70%)',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                }} />

                {/* Stars */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: i % 3 === 0 ? '3px' : '2px',
                            height: i % 3 === 0 ? '3px' : '2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            left: `${10 + (i * 37) % 80}%`,
                            top: `${8 + (i * 29) % 80}%`,
                            opacity: 0.15 + (i % 4) * 0.1,
                            boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                        }}
                    />
                ))}

                {/* Logo Section */}
                <div style={{
                    marginBottom: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #5d00ff 0%, #bc13fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        boxShadow: '0 4px 30px rgba(93,0,255,0.4), 0 0 60px rgba(188,19,254,0.2)',
                        border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <span style={{ fontSize: '36px' }}>⚔️</span>
                    </div>

                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 900,
                        letterSpacing: '3px',
                        background: 'linear-gradient(135deg, #e0e0ff 0%, #a78bfa 50%, #bc13fe 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                    }}>
                        {t('verification.title')}
                    </h1>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '14px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                    }}>
                        {t('verification.subtitle')}
                    </p>
                </div>

                {/* Verification Card */}
                <div style={{
                    width: '100%',
                    maxWidth: '340px',
                    background: 'linear-gradient(135deg, rgba(93,0,255,0.08) 0%, rgba(188,19,254,0.05) 100%)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '20px',
                    padding: '32px 24px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                    }}>
                        <span style={{ fontSize: '22px' }}>🔐</span>
                    </div>

                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'white',
                        textAlign: 'center',
                        marginBottom: '8px',
                    }}>
                        {t('verification.worldid_title')}
                    </h2>
                    <p style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        marginBottom: '24px',
                        lineHeight: 1.5,
                    }}>
                        {t('verification.worldid_desc')}
                    </p>

                    <button
                        onClick={onVerify}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #5d00ff 0%, #7c3aed 50%, #bc13fe 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 20px rgba(93,0,255,0.4), 0 0 40px rgba(188,19,254,0.15)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                }} />
                                <span>{t('verification.verifying')}</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                <span>{t('verification.verify_btn')}</span>
                            </>
                        )}
                    </button>

                    <div style={{
                        marginTop: '24px',
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(139,92,246,0.15)',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            alignItems: 'center',
                        }}>
                            <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                                {t('verification.secure')}
                            </p>
                            <p style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center' }}>
                                {t('verification.privacy')}
                            </p>
                        </div>
                    </div>
                </div>

                <p style={{
                    marginTop: '24px',
                    fontSize: '11px',
                    color: '#4b5563',
                    textAlign: 'center',
                }}>
                    {t('verification.required')}
                </p>

                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </MobileLayout>
    );
};
