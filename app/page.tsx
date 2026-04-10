'use client';

import React, { useState } from 'react';
import InstagramPublisher from '@/components/InstagramPublisher';
import SlidePresentation from '@/components/SlidePresentation';
import InstagramCarouselPreview from '@/components/InstagramCarouselPreview';
import VectorDBManager from '@/components/VectorDBManager';
import { Layout, Presentation, Instagram, Database } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'publisher' | 'slides' | 'carousel' | 'vectordb'>('publisher');

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* View Switcher */}
      <div className="fixed top-6 right-6 z-50 flex bg-white rounded-full shadow-lg border border-zinc-200 p-1">
        <button 
          onClick={() => setView('publisher')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'publisher' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          <Layout className="w-3 h-3" /> Publisher
        </button>
        <button 
          onClick={() => setView('slides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'slides' ? 'bg-[#FF6A00] text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          <Presentation className="w-3 h-3" /> Slides
        </button>
        <button 
          onClick={() => setView('carousel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'carousel' ? 'bg-[#D4AF37] text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          <Instagram className="w-3 h-3" /> Carousel
        </button>
        <button 
          onClick={() => setView('vectordb')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${view === 'vectordb' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          <Database className="w-3 h-3" /> Vector DB
        </button>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="relative z-10">
        {view === 'publisher' ? (
          <div className="py-12 px-4 sm:px-6 lg:px-8">
            <InstagramPublisher />
          </div>
        ) : view === 'slides' ? (
          <SlidePresentation />
        ) : view === 'carousel' ? (
          <InstagramCarouselPreview />
        ) : (
          <div className="py-12 px-4 sm:px-6 lg:px-8">
            <VectorDBManager />
          </div>
        )}
      </div>

      {view === 'publisher' && (
        <footer className="pb-12 text-center text-zinc-400 text-xs">
          <p>© 2026 InstaCarousel Publisher • Powered by Google AI Studio & Meta Graph API</p>
        </footer>
      )}
    </main>
  );
}
