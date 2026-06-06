"use client";
import React from 'react';
import { Slide } from '@/lib/bannergen/types';

interface SlideListProps {
    slides: Slide[];
    activeSlideId: string;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
}

const SlideList: React.FC<SlideListProps> = ({ slides, activeSlideId, onSelect, onAdd, onDelete, onMove }) => {
    return (
        <div className="w-full h-full flex flex-col bg-[#111] border-r border-[#333]">
            <div className="p-4 flex justify-between items-center border-b border-[#333]">
                <h2 className="text-gray-400 font-bold uppercase tracking-wider text-sm">SLIDES</h2>
                <button
                    onClick={onAdd}
                    className="text-xs bg-[#222] hover:bg-[#333] text-lime-400 border border-lime-400/30 px-2 py-1 rounded transition-colors"
                >
                    + Add New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        onClick={() => onSelect(slide.id)}
                        className={`group relative p-3 border rounded cursor-pointer transition-all ${activeSlideId === slide.id
                                ? 'border-lime-400 bg-[#1a1a1a] shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                                : 'border-[#333] bg-[#0a0a0a] hover:border-gray-500'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-gray-500 font-mono">#{index + 1}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); onMove(slide.id, 'up'); }} className="text-gray-400 hover:text-white px-1">↑</button>
                                <button onClick={(e) => { e.stopPropagation(); onMove(slide.id, 'down'); }} className="text-gray-400 hover:text-white px-1">↓</button>
                            </div>
                        </div>
                        <div className="font-bold text-sm text-gray-200 truncate">{slide.headline || 'Untitled'}</div>
                        <div className="text-xs text-gray-500 truncate">{slide.subtext}</div>

                        {/* Delete button always available on hover if more than 1 slide */}
                        {slides.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(slide.id); }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Delete Slide"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SlideList;
