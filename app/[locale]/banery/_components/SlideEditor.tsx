"use client";
import React, { useState } from 'react';
import { Slide, GeneratorStatus, TextAnimation, BorderAnimation, TransitionType } from '@/lib/bannergen/types';
import { generateSlideText, generateSlideBackground } from '@/lib/bannergen/geminiService';

interface SlideEditorProps {
    slide: Slide;
    onUpdate: (updatedSlide: Slide) => void;
    onDelete?: () => void; // Optional if you pass it
    status: GeneratorStatus;
    setStatus: (s: GeneratorStatus) => void;
}

const SlideEditor: React.FC<SlideEditorProps> = ({ slide, onUpdate, status, setStatus }) => {
    const [topic, setTopic] = useState('');
    const [bgPrompt, setBgPrompt] = useState('Cyberpunk matrix grid');

    const handleAutoText = async () => {
        if (!topic) return;
        setStatus(GeneratorStatus.GENERATING_TEXT);
        try {
            const result = await generateSlideText(topic);
            onUpdate({ ...slide, headline: result.headline, subtext: result.subtext });
        } catch (error) {
            console.error(error);
            alert('Failed to generate text. Check console.');
        } finally {
            setStatus(GeneratorStatus.IDLE);
        }
    };

    const handleGenBg = async () => {
        if (!bgPrompt) return;
        setStatus(GeneratorStatus.GENERATING_IMAGE);
        try {
            const bgImage = await generateSlideBackground(bgPrompt);
            onUpdate({ ...slide, backgroundImage: bgImage });
        } catch (error) {
            console.error(error);
            alert('Failed to generate background. Check console.');
        } finally {
            setStatus(GeneratorStatus.IDLE);
        }
    };

    const clearBg = () => {
        onUpdate({ ...slide, backgroundImage: undefined });
    };

    const isBusy = status !== GeneratorStatus.IDLE;

    return (
        <div className="flex flex-col h-full bg-[#111]">
            {/* Editor Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#333] bg-[#0f0f0f]">
                <h2 className="text-xl font-bold text-gray-200">Edit Slide</h2>

                <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500 font-mono">
                        Duration: <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            value={slide.duration}
                            onChange={(e) => onUpdate({ ...slide, duration: parseFloat(e.target.value) })}
                            className="w-12 bg-black border border-[#333] text-center ml-1 text-white focus:border-lime-400"
                        />s
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#111]">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Left Column: Content & Text Styling */}
                    <div className="space-y-8">

                        {/* AI Generator */}
                        <div className="space-y-2 p-4 border border-lime-400/20 rounded bg-[#151515]">
                            <label className="text-xs uppercase text-lime-400 font-bold mb-1 block">AI Auto-Generate</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Topic (e.g. Summer Sale)"
                                    className="flex-1 bg-black border border-[#333] text-gray-200 p-2 text-sm focus:border-lime-400 outline-none"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                                <button
                                    onClick={handleAutoText}
                                    disabled={isBusy || !topic}
                                    className="bg-[#222] hover:bg-[#333] border border-lime-400 text-lime-400 px-3 py-2 text-xs uppercase font-bold disabled:opacity-50"
                                >
                                    {status === GeneratorStatus.GENERATING_TEXT ? '...' : 'Gen'}
                                </button>
                            </div>
                        </div>

                        {/* Headline Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-[#333] pb-1">
                                <label className="text-xs uppercase text-gray-500 font-bold">Headline (Top)</label>
                            </div>
                            <input
                                type="text"
                                value={slide.headline}
                                onChange={(e) => onUpdate({ ...slide, headline: e.target.value })}
                                className="w-full bg-black border border-[#333] text-gray-200 p-3 text-lg font-mono focus:border-lime-400 outline-none"
                                placeholder="HEADLINE TEXT"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">Color</label>
                                    <div className="flex gap-2 items-center bg-black border border-[#333] p-1 px-2 rounded">
                                        <input
                                            type="color"
                                            value={slide.headlineColor}
                                            onChange={(e) => onUpdate({ ...slide, headlineColor: e.target.value })}
                                            className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{slide.headlineColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">Animation</label>
                                    <select
                                        value={slide.headlineAnimation}
                                        onChange={(e) => onUpdate({ ...slide, headlineAnimation: e.target.value as TextAnimation })}
                                        className="w-full bg-black border border-[#333] text-gray-200 p-2 text-xs focus:border-lime-400 outline-none h-[34px]"
                                    >
                                        <option value={TextAnimation.NONE}>None</option>
                                        <option value={TextAnimation.BLINK}>Blink</option>
                                        <option value={TextAnimation.PULSE}>Pulse</option>
                                        <option value={TextAnimation.GLITCH}>Glitch</option>
                                        <option value={TextAnimation.SHAKE}>Shake</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Subtext Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-[#333] pb-1">
                                <label className="text-xs uppercase text-gray-500 font-bold">Subtext (Bottom)</label>
                            </div>
                            <input
                                type="text"
                                value={slide.subtext}
                                onChange={(e) => onUpdate({ ...slide, subtext: e.target.value })}
                                className="w-full bg-black border border-[#333] text-gray-200 p-3 text-sm font-mono focus:border-lime-400 outline-none"
                                placeholder="Subtext details"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">Color</label>
                                    <div className="flex gap-2 items-center bg-black border border-[#333] p-1 px-2 rounded">
                                        <input
                                            type="color"
                                            value={slide.subtextColor}
                                            onChange={(e) => onUpdate({ ...slide, subtextColor: e.target.value })}
                                            className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{slide.subtextColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">Animation</label>
                                    <select
                                        value={slide.subtextAnimation}
                                        onChange={(e) => onUpdate({ ...slide, subtextAnimation: e.target.value as TextAnimation })}
                                        className="w-full bg-black border border-[#333] text-gray-200 p-2 text-xs focus:border-lime-400 outline-none h-[34px]"
                                    >
                                        <option value={TextAnimation.NONE}>None</option>
                                        <option value={TextAnimation.BLINK}>Blink</option>
                                        <option value={TextAnimation.PULSE}>Pulse</option>
                                        <option value={TextAnimation.GLITCH}>Glitch</option>
                                        <option value={TextAnimation.SHAKE}>Shake</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Frame & Background */}
                    <div className="space-y-8">

                        {/* Appearance / Frame */}
                        <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-[#222] pb-2">Frame & Background</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* BG Color */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Base BG Color</label>
                                    <div className="flex gap-2 items-center bg-black border border-[#333] p-1 px-2 rounded">
                                        <input
                                            type="color"
                                            value={slide.bgColor}
                                            onChange={(e) => onUpdate({ ...slide, bgColor: e.target.value })}
                                            className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{slide.bgColor}</span>
                                    </div>
                                </div>

                                {/* Border Color */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Frame Color</label>
                                    <div className="flex gap-2 items-center bg-black border border-[#333] p-1 px-2 rounded">
                                        <input
                                            type="color"
                                            value={slide.borderColor}
                                            onChange={(e) => onUpdate({ ...slide, borderColor: e.target.value })}
                                            className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{slide.borderColor}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Border Animation */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold">Frame Effect</label>
                                <select
                                    value={slide.borderAnimation}
                                    onChange={(e) => onUpdate({ ...slide, borderAnimation: e.target.value as BorderAnimation })}
                                    className="w-full bg-black border border-[#333] text-gray-200 p-2 text-xs focus:border-lime-400 outline-none"
                                >
                                    <option value={BorderAnimation.SOLID}>Solid (Static)</option>
                                    <option value={BorderAnimation.MARQUEE}>Marquee (Dashed Move)</option>
                                    <option value={BorderAnimation.FLASH}>Flashing</option>
                                    <option value={BorderAnimation.NONE}>No Frame</option>
                                </select>
                            </div>

                            {/* Transition */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold">Transition (Entry)</label>
                                <select
                                    value={slide.transitionType}
                                    onChange={(e) => onUpdate({ ...slide, transitionType: e.target.value as TransitionType })}
                                    className="w-full bg-black border border-[#333] text-gray-200 p-2 text-xs focus:border-lime-400 outline-none"
                                >
                                    <option value={TransitionType.NONE}>Cut (Instant)</option>
                                    <option value={TransitionType.FLASH_WHITE}>Flash White</option>
                                    <option value={TransitionType.BLACKOUT}>Blackout</option>
                                </select>
                            </div>
                        </div>

                        {/* AI Background */}
                        <div className="space-y-2 h-full flex flex-col">
                            <label className="text-xs uppercase text-gray-500 font-bold">AI Generative Background</label>
                            <textarea
                                className="w-full h-24 bg-black border border-[#333] text-gray-200 p-3 text-sm font-mono focus:border-lime-400 outline-none resize-none"
                                placeholder="Describe background texture..."
                                value={bgPrompt}
                                onChange={(e) => setBgPrompt(e.target.value)}
                            />

                            <div className="flex justify-end gap-2 mt-2">
                                {slide.backgroundImage && (
                                    <button
                                        onClick={clearBg}
                                        className="px-4 py-2 text-xs uppercase font-bold text-gray-500 hover:text-white transition-colors"
                                    >
                                        Clear BG
                                    </button>
                                )}
                                <button
                                    onClick={handleGenBg}
                                    disabled={isBusy || !bgPrompt}
                                    className="bg-[#222] hover:bg-[#333] border border-gray-600 hover:border-lime-400 text-gray-200 px-6 py-2 text-xs uppercase font-bold transition-all disabled:opacity-50"
                                >
                                    {status === GeneratorStatus.GENERATING_IMAGE ? 'Dreaming...' : 'Generate BG'}
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default SlideEditor;
