'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "PARE DE PERDER <span class='text-[#FF6A00]'>DINHEIRO</span> COM ANÚNCIOS GENÉRICOS",
    subtitle: "A escala via IA não é mais uma opção, é a regra do jogo.",
    content: "Engenheiros estão sendo substituídos por algoritmos de alta performance. Sua empresa está pronta?",
    image: "https://picsum.photos/seed/tech/800/800",
    button: "DOMINAR O MERCADO"
  },
  {
    id: 2,
    title: "RESULTADOS <span class='text-[#FF6A00]'>TANGÍVEIS</span> EM 24 HORAS",
    subtitle: "Esqueça métricas de vaidade. Foque no que coloca dinheiro no bolso.",
    columns: [
      { icon: <Zap className="w-6 h-6 text-[#FF6A00]" />, text: "Automação total de criativos de alta conversão." },
      { icon: <Target className="w-6 h-6 text-[#FF6A00]" />, text: "Segmentação cirúrgica baseada em comportamento real." },
      { icon: <TrendingUp className="w-6 h-6 text-[#FF6A00]" />, text: "ROI 3x superior aos métodos tradicionais." }
    ],
    image: "https://picsum.photos/seed/growth/800/800"
  },
  {
    id: 3,
    title: "O FUTURO É <span class='text-[#FF6A00]'>AGORA</span> OU NUNCA",
    subtitle: "A janela de oportunidade está fechando para quem hesita.",
    content: "Junte-se aos 1% que estão usando o Cleudocode para dominar o tráfego pago.",
    image: "https://picsum.photos/seed/future/800/800",
    button: "INICIAR TRANSFORMAÇÃO"
  }
];

export default function SlidePresentation() {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-zinc-100 p-8 flex flex-col items-center justify-center font-display">
      <div className="max-w-6xl w-full flex justify-between items-center mb-4 px-4">
        <h2 className="text-zinc-400 font-bold text-sm tracking-widest uppercase">Slide Previewer / High Impact</h2>
        <div className="flex gap-2">
          <button onClick={prevSlide} className="p-2 bg-white rounded-full shadow-sm hover:bg-zinc-50 transition-colors">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <button onClick={nextSlide} className="p-2 bg-white rounded-full shadow-sm hover:bg-zinc-50 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide Container (16:9) */}
      <div className="relative w-full max-w-6xl aspect-[16/9] bg-white shadow-2xl overflow-hidden rounded-lg border border-zinc-200">
        
        {/* Safe Zone Indicator (Visual only for editor) */}
        <div className="absolute bottom-0 left-0 w-full h-[15%] bg-zinc-50/50 border-t border-dashed border-zinc-200 z-10 flex items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold">Safe Zone (15% Bottom) - No Content Here</span>
        </div>

        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 p-[80px] pb-[15%] flex flex-col justify-start"
        >
          <div className="grid grid-cols-12 gap-12 h-full">
            
            {/* Left Content */}
            <div className="col-span-7 flex flex-col justify-center gap-6">
              <h1 
                className="text-5xl font-black text-[#333333] leading-[1.1] tracking-tight uppercase"
                dangerouslySetInnerHTML={{ __html: slides[currentSlide].title }}
              />
              
              <p className="text-xl font-medium text-[#333333] opacity-80 leading-relaxed">
                {slides[currentSlide].subtitle}
              </p>

              {slides[currentSlide].content && (
                <p className="text-lg text-[#333333] opacity-60 leading-relaxed max-w-md">
                  {slides[currentSlide].content}
                </p>
              )}

              {slides[currentSlide].columns && (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {slides[currentSlide].columns.map((col, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="shrink-0">{col.icon}</div>
                      <p className="text-sm font-bold text-[#333333]">{col.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {slides[currentSlide].button && (
                <div className="mt-8">
                  <button className="px-8 py-4 bg-gradient-to-r from-[#FF6A00] to-[#E53935] text-white font-black rounded-full shadow-lg shadow-orange-200 hover:scale-105 transition-transform flex items-center gap-3 tracking-widest text-sm">
                    {slides[currentSlide].button}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Visual */}
            <div className="col-span-5 relative flex items-center justify-center">
              {/* Organic Shape Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6A00]/10 to-[#E53935]/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-pulse" />
              
              {/* Circular Cutout Photo */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden border-8 border-white shadow-xl">
                <img 
                  src={slides[currentSlide].image} 
                  alt="Visual" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Decorative Pill */}
              <div className="absolute -bottom-4 -right-4 px-6 py-2 bg-[#FF6A00] text-white text-[10px] font-black rounded-full shadow-lg tracking-widest">
                ACI / 2026
              </div>
            </div>

          </div>
        </motion.div>

        {/* Slide Counter */}
        <div className="absolute top-8 right-8 text-zinc-300 font-black text-4xl italic">
          0{currentSlide + 1}
        </div>
      </div>

      <div className="mt-8 text-center max-w-2xl">
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">
          Design assinado por <span className="font-bold text-zinc-600">Diretor de Arte Sênior</span>. 
          Foco em autoridade, contraste e legibilidade. 
          A margem de 15% inferior está preservada para remoção de branding na pós-produção.
        </p>
      </div>
    </div>
  );
}
