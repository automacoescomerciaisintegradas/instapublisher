'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight } from 'lucide-react';

const carouselSlides = [
  {
    id: 1,
    type: 'hook',
    title: "A Arte da <span class='italic'>Automação</span> Sofisticada",
    subtitle: "Como elevar seu posicionamento digital sem perder a essência humana.",
    number: "01",
    image: "https://picsum.photos/seed/minimal/800/1000"
  },
  {
    id: 2,
    type: 'hook',
    title: "O Segredo está no <span class='italic'>Equilíbrio</span>",
    subtitle: "Tecnologia de ponta aliada a um design que respira e comunica autoridade.",
    number: "02",
    image: "https://picsum.photos/seed/balance/800/1000"
  },
  {
    id: 3,
    type: 'content',
    title: "Design que <span class='italic'>Converte</span>",
    subtitle: "Cada elemento visual é pensado para guiar o olhar e reduzir a fricção na leitura.",
    content: "Margens generosas e tipografia serifada criam um ambiente de luxo e confiança.",
    number: "03",
    image: "https://picsum.photos/seed/design/800/1000"
  },
  {
    id: 4,
    type: 'content',
    title: "Escala com <span class='italic'>Precisão</span>",
    subtitle: "Automatizar não significa ser genérico. Significa ser eficiente onde importa.",
    content: "Nossa IA orquestra posts que parecem ter sido feitos à mão por um diretor de arte.",
    number: "04",
    image: "https://picsum.photos/seed/precision/800/1000"
  },
  {
    id: 5,
    type: 'content',
    title: "O Poder do <span class='italic'>Minimalismo</span>",
    subtitle: "Menos ruído, mais impacto. No feed saturado, o silêncio visual é quem grita.",
    content: "Respeitar a área segura é o primeiro passo para um feed profissional.",
    number: "05",
    image: "https://picsum.photos/seed/minimalist/800/1000"
  },
  {
    id: 6,
    type: 'cta',
    title: "Pronto para o <span class='italic'>Próximo Nível?</span>",
    subtitle: "Transforme sua presença digital hoje com o Cleudocode Agent.",
    content: "Toque no link da bio e inicie sua jornada de automação premium.",
    number: "06",
    image: "https://picsum.photos/seed/next/800/1000",
    cta: "COMEÇAR AGORA"
  }
];

export default function InstagramCarouselPreview() {
  const [current, setCurrent] = React.useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % carouselSlides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);

  return (
    <div className="min-h-screen bg-[#F0EEE9] p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-[500px] w-full flex justify-between items-center mb-6 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#bab3a5] uppercase">Instagram Carousel</span>
          <span className="text-xs font-serif italic text-[#333333]">Vertical Format 4:5</span>
        </div>
        <div className="flex gap-3">
          <button onClick={prev} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-[#F9F7F2] transition-colors border border-[#bab3a5]/20">
            <ChevronRight className="w-4 h-4 rotate-180 text-[#333333]" />
          </button>
          <button onClick={next} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-[#F9F7F2] transition-colors border border-[#bab3a5]/20">
            <ChevronRight className="w-4 h-4 text-[#333333]" />
          </button>
        </div>
      </div>

      {/* Carousel Container (4:5 Aspect Ratio) */}
      <div className="relative w-full max-w-[500px] aspect-[4/5] bg-[#F9F7F2] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden rounded-sm border border-[#bab3a5]/10">
        
        {/* Safe Area Guides (Visual Only) */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-[12.5%] border border-dashed border-[#bab3a5]/30 rounded-sm">
            <span className="absolute -top-5 left-0 text-[8px] font-bold text-[#bab3a5] uppercase tracking-widest">Safe Area 12.5%</span>
          </div>
        </div>

        <motion.div
          key={current}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 p-[12.5%] flex flex-col justify-between"
        >
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div className="h-[1px] w-12 bg-[#bab3a5] mt-2" />
            <span className="text-[10px] font-bold tracking-widest text-[#D4AF37]">STEPS .{carouselSlides[current].number}</span>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6 relative z-10">
            <h2 
              className="text-4xl font-serif text-[#333333] leading-[1.15] tracking-tight"
              dangerouslySetInnerHTML={{ __html: carouselSlides[current].title }}
            />
            
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-[#333333] opacity-80 leading-relaxed max-w-[85%]">
                {carouselSlides[current].subtitle}
              </p>
              
              {carouselSlides[current].content && (
                <p className="text-[11px] text-[#333333] opacity-60 leading-relaxed max-w-[75%]">
                  {carouselSlides[current].content}
                </p>
              )}
            </div>

            {carouselSlides[current].cta && (
              <div className="mt-4">
                <button className="px-6 py-3 bg-[#333333] text-[#F9F7F2] text-[10px] font-bold tracking-[0.2em] rounded-sm hover:bg-black transition-colors flex items-center gap-3">
                  {carouselSlides[current].cta}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Visual Element */}
          <div className="relative h-1/2 w-full mt-4">
            {/* Background Block */}
            <div className="absolute -top-4 -left-4 w-24 h-32 bg-[#bab3a5] opacity-20" />
            
            {/* Arched Frame Image */}
            <div className="relative w-full h-full rounded-t-full overflow-hidden shadow-lg grayscale-[0.2] sepia-[0.1]">
              <img 
                src={carouselSlides[current].image} 
                alt="Visual" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Large Number Accent */}
            <div className="absolute -bottom-8 -right-4 text-8xl font-serif text-[#D4AF37] opacity-10 select-none">
              {carouselSlides[current].number}
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-bold text-[#bab3a5] uppercase tracking-widest">Cleudocode Agent</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-[#333333] uppercase tracking-widest">Next</span>
              <ChevronRight className="w-2 h-2 text-[#333333]" />
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-[#D4AF37]/20 w-full">
          <motion.div 
            className="h-full bg-[#D4AF37]"
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / carouselSlides.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="mt-10 text-center max-w-sm">
        <p className="text-[#bab3a5] text-[10px] font-medium leading-relaxed uppercase tracking-widest">
          Design Minimalista & Sofisticado <br/>
          <span className="text-[#333333]/40">Proporção 4:5 | Área Segura 12.5% Preservada</span>
        </p>
      </div>
    </div>
  );
}
