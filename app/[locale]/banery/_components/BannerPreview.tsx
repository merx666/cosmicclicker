"use client";
import React, { forwardRef } from 'react';
import { Slide, TextAnimation, BorderAnimation } from '@/lib/bannergen/types';

interface BannerPreviewProps {
    slide: Slide;
    width?: number;
    height?: number;
    scale?: number;
    id?: string;
    captureTime?: number; // Time in seconds to freeze animation at
}

const BannerPreview = forwardRef<HTMLDivElement, BannerPreviewProps>(({ slide, width = 960, height = 100, scale = 1, id, captureTime }, ref) => {

    // Helper to generate border styles
    const getBorderStyles = () => {
        const base = {
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: slide.bgColor,
            backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
        };

        if (slide.borderAnimation === BorderAnimation.NONE) {
            return { ...base, border: 'none' };
        }

        return {
            ...base,
            border: `2px solid ${slide.borderColor}`
        };
    };

    const getAnimationClass = (animType: TextAnimation) => {
        switch (animType) {
            case TextAnimation.BLINK: return 'animate-blink';
            case TextAnimation.PULSE: return 'animate-pulse-fast';
            case TextAnimation.GLITCH: return 'animate-glitch';
            case TextAnimation.SHAKE: return 'animate-shake';
            default: return '';
        }
    };

    const getBorderClass = () => {
        switch (slide.borderAnimation) {
            case BorderAnimation.MARQUEE: return 'border-dashed animate-border-march';
            case BorderAnimation.FLASH: return 'animate-border-flash';
            case BorderAnimation.SOLID: return 'border-solid';
            default: return '';
        }
    };

    // Helper to force animation state for capture
    const getFreezeStyle = () => {
        if (typeof captureTime !== 'number') return {};
        return {
            animationPlayState: 'paused',
            animationDelay: `-${captureTime}s`,
        };
    };

    return (
        <>
            <style jsx global>{`
        @keyframes blink { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.2; } 
        }
        @keyframes pulse-fast { 
          0%, 100% { transform: scale(1); } 
          50% { transform: scale(1.05); } 
        }
        @keyframes glitch {
          0% { transform: translate(0); text-shadow: -2px 0 red, 2px 0 blue; }
          25% { transform: translate(-2px, 2px); text-shadow: 2px -1px red, -2px 1px blue; }
          50% { transform: translate(2px, -2px); text-shadow: -1px 2px red, 1px -2px blue; }
          75% { transform: translate(-1px, -1px); text-shadow: 1px 1px red, -1px -1px blue; }
          100% { transform: translate(0); text-shadow: -2px 0 red, 2px 0 blue; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes border-flash {
          0%, 100% { border-color: ${slide.borderColor}; }
          50% { border-color: transparent; }
        }
        @keyframes border-march {
            0% { background-position: 0 0, 0 100%, 0 0, 100% 0; }
            100% { background-position: 40px 0, -40px 100%, 0 -40px, 100% 40px; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }
        .animate-glitch { animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        .animate-border-flash { animation: border-flash 0.5s step-end infinite; }
        .animate-border-march { 
            background: linear-gradient(90deg, ${slide.borderColor} 50%, transparent 50%), 
                        linear-gradient(90deg, ${slide.borderColor} 50%, transparent 50%), 
                        linear-gradient(0deg, ${slide.borderColor} 50%, transparent 50%), 
                        linear-gradient(0deg, ${slide.borderColor} 50%, transparent 50%);
            background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
            background-size: 20px 4px, 20px 4px, 4px 20px, 4px 20px;
            background-position: 0 0, 0 100%, 0 0, 100% 0;
            animation: border-march 1s linear infinite;
        }
      `}</style>
            {/* Changed style tag to jsx global or module css - trying inline style tag with template literal for now, verifying it works in Next.js */}

            <div
                id={id}
                ref={ref}
                style={{ ...getBorderStyles(), ...getFreezeStyle() }}
                className={`relative flex flex-col items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] box-border ${getBorderClass()}`}
            >
                {/* Overlay for readability if BG image exists */}
                {slide.backgroundImage && (
                    <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                )}

                <div className="z-10 text-center flex flex-col items-center gap-1">
                    <h1
                        style={{
                            color: slide.headlineColor,
                            textShadow: `0 0 10px ${slide.headlineColor}`,
                            ...getFreezeStyle()
                        }}
                        className={`text-5xl font-black tracking-wider uppercase font-mono leading-none ${getAnimationClass(slide.headlineAnimation)}`}
                    >
                        {slide.headline}
                    </h1>
                    <p
                        style={{
                            color: slide.subtextColor,
                            ...getFreezeStyle()
                        }}
                        className={`text-xl font-bold tracking-[0.2em] uppercase font-mono mt-1 ${getAnimationClass(slide.subtextAnimation)}`}
                    >
                        {slide.subtext}
                    </p>
                </div>

                {/* Decorative corners */}
                {slide.borderAnimation !== BorderAnimation.NONE && (
                    <>
                        <div style={{ borderColor: slide.borderColor }} className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 opacity-50"></div>
                        <div style={{ borderColor: slide.borderColor }} className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 opacity-50"></div>
                        <div style={{ borderColor: slide.borderColor }} className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 opacity-50"></div>
                        <div style={{ borderColor: slide.borderColor }} className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 opacity-50"></div>
                    </>
                )}
            </div>
        </>
    );
});

BannerPreview.displayName = 'BannerPreview';

export default BannerPreview;
