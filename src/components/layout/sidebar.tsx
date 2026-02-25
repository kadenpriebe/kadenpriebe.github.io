'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const QUOTES = [
  "Curiosity is the wick in the candle of learning.",
  "Building things to understand how they break.",
  "Biology is just complicated chemistry.",
  "Computation is just fast counting.",
  "Always be learning something new.",
  "Personality-first, everything else second.",
];

export function Sidebar() {
  const pathname = usePathname();
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 10000); // 10s per quote
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="w-80 border-l border-black/5 bg-white/50 backdrop-blur-sm p-8 hidden lg:flex flex-col gap-12 sticky top-0 h-screen overflow-y-auto">
      {/* Status Indicator */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Current Status</h3>
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-20" />
          </div>
          <span className="text-sm font-medium text-brand-text group-hover:text-emerald-600 transition-colors">Coding in the library</span>
        </div>
      </div>

      {/* Quote Rotator */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Random Thought</h3>
        <motion.p 
          key={quoteIdx}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="text-sm italic text-brand-muted leading-relaxed"
        >
          "{QUOTES[quoteIdx]}"
        </motion.p>
      </div>

      {/* Mini Doodle Pad Placeholder */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Mini Doodle</h3>
        <div className="aspect-square bg-white border border-black/5 rounded-2xl flex items-center justify-center group cursor-crosshair overflow-hidden">
          <p className="text-[10px] text-brand-muted group-hover:text-cyan-600 transition-colors">Click to scribble (coming soon!)</p>
          {/* We'll implement a real doodle pad later in Phase 4/5 */}
        </div>
      </div>

      {/* Page Context Widget (Dynamic based on route) */}
      {pathname.includes('/blog') && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <h4 className="text-[10px] font-bold uppercase text-indigo-700 mb-2">Blog Context</h4>
          <p className="text-[11px] text-indigo-800/80 leading-snug">Writing about tech & bio. Check out my YouTube for video versions.</p>
        </div>
      )}

      {pathname.includes('/coursework') && (
        <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
          <h4 className="text-[10px] font-bold uppercase text-cyan-700 mb-2">Learning Lab</h4>
          <p className="text-[11px] text-cyan-800/80 leading-snug">I make interactive tools for every class I take. This helps me learn concepts better.</p>
        </div>
      )}

      {/* Mini Game Link */}
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group overflow-hidden relative">
        <h4 className="text-[10px] font-bold uppercase text-emerald-700 mb-2">Micro-Game</h4>
        <p className="text-[11px] text-emerald-800/80 leading-snug mb-3">Bored? Try matching some DNA base pairs.</p>
        <Link 
          href="/games/dna-match" 
          className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
        >
          Play DNA Matcher 🧬
        </Link>
        <div className="absolute -bottom-4 -right-4 text-4xl opacity-10 group-hover:rotate-12 transition-transform duration-500">🧬</div>
      </div>

      <div className="mt-auto pt-8 border-t border-black/5">
        <p className="text-[10px] text-brand-muted/60 text-center uppercase tracking-widest">
          Build 2026.02.24
        </p>
      </div>
    </aside>
  );
}
