"use client";
import React, { useState, useRef } from 'react';
import Script from 'next/script'; // For loading CDN libs
import { Slide, GeneratorStatus } from '@/lib/bannergen/types';
import { DEFAULT_SLIDE } from '@/lib/bannergen/constants';
import BannerPreview from './_components/BannerPreview';
import SlideList from './_components/SlideList';
import SlideEditor from './_components/SlideEditor';
import { generateGif } from '@/lib/bannergen/gifService';
import { generateId } from '@/lib/bannergen/utils';

const PREVIEW_WIDTH = 960;
const PREVIEW_HEIGHT = 100;

export default function Page() {
    const [slides, setSlides] = useState<Slide[]>([DEFAULT_SLIDE]);
    const [activeSlideId, setActiveSlideId] = useState<string>(DEFAULT_SLIDE.id);
    const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
    const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [captureTime, setCaptureTime] = useState<number | undefined>(undefined);

    // Reference for the hidden capture div
    const captureRef = useRef<HTMLDivElement>(null);

    const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

    const handleAddSlide = () => {
        const newSlide: Slide = {
            ...DEFAULT_SLIDE,
            id: generateId(),
            headline: 'NEW SLIDE',
            subtext: 'EDIT ME',
        };
        setSlides([...slides, newSlide]);
        setActiveSlideId(newSlide.id);
    };

    const handleUpdateSlide = (updated: Slide) => {
        setSlides(slides.map(s => s.id === updated.id ? updated : s));
    };

    const handleDeleteSlide = (id: string) => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter(s => s.id !== id);
        setSlides(newSlides);
        if (activeSlideId === id) {
            setActiveSlideId(newSlides[0].id);
        }
    };

    const handleMoveSlide = (id: string, direction: 'up' | 'down') => {
        const index = slides.findIndex(s => s.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === slides.length - 1) return;

        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        setSlides(newSlides);
    };

    const handleGenerateGif = async () => {
        if (!captureRef.current) return;
        setStatus(GeneratorStatus.RENDERING_GIF);
        setIsPreviewing(true);
        setGeneratedGifUrl(null);

        try {
            const gifUrl = await generateGif(
                'capture-container',
                slides,
                (id) => setActiveSlideId(id),
                (time) => setCaptureTime(time),
                PREVIEW_WIDTH,
                PREVIEW_HEIGHT
            );
            setGeneratedGifUrl(gifUrl);
            setStatus(GeneratorStatus.SUCCESS);
        } catch (error: any) {
            console.error(error);
            alert('Error generating GIF: ' + error);
            setStatus(GeneratorStatus.ERROR);
        } finally {
            setIsPreviewing(false);
            setCaptureTime(undefined);
        }
    };

    return (
        <>
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js" strategy="beforeInteractive" />
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js" strategy="beforeInteractive" />

            <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden font-sans">

                {/* Header */}
                <header className="h-14 border-b border-[#333] bg-[#050505] flex justify-between items-center px-6">
                    <h1 className="text-lime-400 font-black tracking-tighter text-xl">PURE<span className="text-white">GEN</span> v1</h1>
                    <div className="text-xs text-gray-500 font-mono">
                        {status === GeneratorStatus.RENDERING_GIF ?
                            <span className="text-lime-400 animate-pulse">RENDERING... PLEASE WAIT</span> :
                            <span>READY</span>
                        }
                    </div>
                    <button
                        onClick={handleGenerateGif}
                        disabled={status !== GeneratorStatus.IDLE && status !== GeneratorStatus.SUCCESS}
                        className="bg-lime-400 text-black px-6 py-1.5 text-sm font-bold uppercase hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Export GIF
                    </button>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Sidebar: Slide List */}
                    <div className="w-64 flex-shrink-0 z-10">
                        <SlideList
                            slides={slides}
                            activeSlideId={activeSlideId}
                            onSelect={setActiveSlideId}
                            onAdd={handleAddSlide}
                            onDelete={handleDeleteSlide}
                            onMove={handleMoveSlide}
                        />
                    </div>

                    {/* Main Area: Editor & Preview */}
                    <div className="flex-1 flex flex-col min-w-0">

                        {/* Visual Preview Area (Top) */}
                        <div className="h-[250px] bg-[#080808] border-b border-[#333] p-8 flex items-center justify-center relative shadow-inner">
                            <div className="scale-[0.8] md:scale-100 transition-transform origin-center">
                                <BannerPreview
                                    slide={activeSlide}
                                    width={PREVIEW_WIDTH}
                                    height={PREVIEW_HEIGHT}
                                />
                            </div>
                        </div>

                        {/* Editor Area (Bottom) */}
                        <div className="flex-1 min-h-0 bg-[#0f0f0f]">
                            <SlideEditor
                                slide={activeSlide}
                                onUpdate={handleUpdateSlide}
                                status={status}
                                setStatus={setStatus}
                            />
                        </div>
                    </div>

                    {/* Result Panel (Overlay) */}
                    {generatedGifUrl && (
                        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-10">
                            <div className="bg-[#111] border border-lime-400 p-8 max-w-4xl w-full text-center space-y-6 shadow-[0_0_50px_rgba(204,255,0,0.2)]">
                                <h2 className="text-3xl font-black text-white uppercase">Banner Ready</h2>
                                <div className="flex justify-center p-4 bg-black border border-[#333]">
                                    <img src={generatedGifUrl} alt="Generated Banner" className="max-w-full" />
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <a
                                        href={generatedGifUrl}
                                        download={`pureonly-banner-${Date.now()}.gif`}
                                        className="bg-lime-400 text-black px-8 py-3 font-bold uppercase text-lg hover:bg-lime-300 transition-colors"
                                    >
                                        Download .GIF
                                    </a>
                                    <button
                                        onClick={() => setGeneratedGifUrl(null)}
                                        className="border border-gray-600 text-gray-400 px-8 py-3 font-bold uppercase text-lg hover:text-white hover:border-white transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Hidden Capture Container */}
                <div
                    style={{
                        position: 'fixed',
                        top: '-9999px',
                        left: '-9999px',
                        width: `${PREVIEW_WIDTH}px`,
                        height: `${PREVIEW_HEIGHT}px`,
                    }}
                >
                    <div id="capture-container">
                        {/* Only render ONE slide at a time for capture based on activeSlideId derived from callback/state in render loop */}
                        {/* Wait, the loop in gifService updates activeSlideId? No, it sets the slide callback. 
                     We need to render the slide that matches activeSlideId state, which IS updating during generation.
                 */}
                        <BannerPreview
                            slide={activeSlide}
                            width={PREVIEW_WIDTH}
                            height={PREVIEW_HEIGHT}
                            captureTime={captureTime} // Pass capture time for freezing animations
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
