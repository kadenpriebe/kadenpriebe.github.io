'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import Link from 'next/link';

type QuadrantType = 'bio' | 'ml' | 'phil' | 'build' | null;

export default function Playground() {
  const [quadrant, setQuadrant] = useState<QuadrantType>(null);
  const [isHoveringObject, setIsHoveringObject] = useState(false);
  const [activeOrganelle, setActiveOrganelle] = useState<string | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const getCursorContent = () => {
    switch (quadrant) {
      case 'bio': return <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px]">🧬</motion.span>;
      case 'ml': return <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px]">⚡</motion.span>;
      case 'phil': return <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px]">🖋️</motion.span>;
      case 'build': return <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px]">🛠️</motion.span>;
      default: return null;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden cursor-none bg-white">
      {/* Custom Morphing Cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: quadrant ? (isHoveringObject ? 64 : 48) : 12,
          height: quadrant ? (isHoveringObject ? 64 : 48) : 12,
          backgroundColor: quadrant ? 'rgba(255,255,255,0.9)' : '#000',
          borderRadius: quadrant === 'ml' ? '8px' : '50%',
        }}
      >
        <AnimatePresence mode="wait">
          {quadrant && (
            <motion.div
              key={quadrant}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              {getCursorContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Central Identity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="font-heading text-5xl font-black tracking-tighter text-black sm:text-8xl">
            kaden priebe
          </h1>
          <p className="mt-4 text-zinc-400 font-medium tracking-[0.3em] text-xs uppercase">
            Biology • Machine Learning • Philosophy
          </p>
        </motion.div>
      </div>

      {/* Quadrants */}
      <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
        
        {/* TOP LEFT: BIOLOGY (Clickable Organelles) */}
        <div 
          className="relative flex items-center justify-center group border-r border-b border-zinc-50"
          onMouseEnter={() => setQuadrant('bio')}
          onMouseLeave={() => setQuadrant(null)}
        >
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div
              onMouseEnter={() => setIsHoveringObject(true)}
              onMouseLeave={() => setIsHoveringObject(false)}
              className="w-48 h-48 rounded-[48%_52%_55%_45%/45%_48%_52%_55%] border-2 border-cyan-500/20 bg-cyan-50/10 flex items-center justify-center animate-[morph_10s_infinite_ease-in-out] relative"
            >
              {/* Clickable Organelles */}
              <Organelle 
                id="nucleus" 
                label="Research" 
                href="/coursework" 
                className="top-1/4 left-1/3 w-10 h-10 bg-cyan-500/40"
                onHover={setActiveOrganelle}
              />
              <Organelle 
                id="mitochondria" 
                label="Game" 
                href="/games/dna-match" 
                className="bottom-1/4 right-1/4 w-12 h-6 bg-cyan-400/30 rotate-45"
                onHover={setActiveOrganelle}
              />
              <Organelle 
                id="ribosome" 
                label="Bio" 
                href="/about" 
                className="top-1/2 right-1/4 w-4 h-4 bg-cyan-600/20"
                onHover={setActiveOrganelle}
              />
            </motion.div>
            
            <AnimatePresence>
              {activeOrganelle && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-0 text-[10px] font-black tracking-[0.2em] uppercase text-cyan-600"
                >
                  {activeOrganelle}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* TOP RIGHT: MACHINE LEARNING (Neural Nodes) */}
        <div 
          className="relative flex items-center justify-center group border-b border-zinc-50"
          onMouseEnter={() => setQuadrant('ml')}
          onMouseLeave={() => setQuadrant(null)}
        >
          <Link href="/projects" className="relative cursor-none" onMouseEnter={() => setIsHoveringObject(true)} onMouseLeave={() => setIsHoveringObject(false)}>
            <div className="w-64 h-64 relative">
              <NeuralNetwork active={quadrant === 'ml'} />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black tracking-widest uppercase text-violet-600">
              Projects
            </div>
          </Link>
        </div>

        {/* BOTTOM LEFT: PHILOSOPHY (The Bust) */}
        <div 
          className="relative flex items-center justify-center group border-r border-zinc-50"
          onMouseEnter={() => setQuadrant('phil')}
          onMouseLeave={() => setQuadrant(null)}
        >
          <Link href="/blog" className="relative cursor-none" onMouseEnter={() => setIsHoveringObject(true)} onMouseLeave={() => setIsHoveringObject(false)}>
            <div className="relative w-32 h-48 bg-zinc-100 rounded-[50%_50%_15%_15%] overflow-hidden transition-transform duration-500 group-hover:scale-105">
              {/* Cracks and Glow */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#fff_48%,#fff_52%,transparent_55%)] opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <motion.div 
                animate={{ 
                  scale: quadrant === 'phil' ? 1 : 0,
                  opacity: quadrant === 'phil' ? 1 : 0
                }}
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500 rounded-full blur-3xl"
              />
              <div className="absolute bottom-0 w-full h-1/2 bg-zinc-200/50" />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black tracking-widest uppercase text-rose-600">
              Thoughts
            </div>
          </Link>
        </div>

        {/* BOTTOM RIGHT: BUILDING (Lego) */}
        <div 
          className="relative flex items-center justify-center group"
          onMouseEnter={() => setQuadrant('build')}
          onMouseLeave={() => setQuadrant(null)}
        >
          <Link href="/projects" className="relative cursor-none" onMouseEnter={() => setIsHoveringObject(true)} onMouseLeave={() => setIsHoveringObject(false)}>
            <motion.div
              whileHover={{ rotate: 0, scale: 1.1, y: -10 }}
              initial={{ rotate: -15 }}
              className="w-32 h-20 bg-amber-500 rounded-sm shadow-[8px_8px_0_#b45309] relative transition-shadow"
            >
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`absolute w-6 h-6 rounded-full bg-amber-500 shadow-inner ${
                  i === 0 ? '-top-3 left-4' : 
                  i === 1 ? '-top-3 right-4' : 
                  i === 2 ? 'top-8 left-4' : 'top-8 right-4'
                }`} />
              ))}
            </motion.div>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black tracking-widest uppercase text-amber-600">
              Experiments
            </div>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes morph {
          0%, 100% { border-radius: 48% 52% 55% 45% / 45% 48% 52% 55%; }
          50% { border-radius: 55% 45% 48% 52% / 52% 55% 45% 48%; }
        }
      `}</style>

      {/* Boring Menu in corner */}
      <div className="absolute bottom-12 right-12 z-[100]">
        <Link 
          href="/links" 
          className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-300 hover:text-black transition-colors cursor-none px-4 py-2 border border-transparent hover:border-zinc-100 rounded-full"
          onMouseEnter={() => setQuadrant(null)}
        >
          Archive / Contact
        </Link>
      </div>
    </div>
  );
}

function Organelle({ id, label, href, className, onHover }: { 
  id: string, 
  label: string, 
  href: string, 
  className: string,
  onHover: (label: string | null) => void 
}) {
  return (
    <Link 
      href={href}
      className={`absolute rounded-full cursor-none transition-all hover:scale-125 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] ${className}`}
      onMouseEnter={() => onHover(label)}
      onMouseLeave={() => onHover(null)}
    />
  );
}

function NeuralNetwork({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const nodes = Array.from({ length: 12 }, () => ({
      x: Math.random() * 256,
      y: Math.random() * 256,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, 256, 256);
      ctx.strokeStyle = active ? 'rgba(124, 58, 237, 0.3)' : 'rgba(244, 244, 245, 0.5)';
      ctx.fillStyle = active ? '#7c3aed' : '#f4f4f5';

      nodes.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 256) n.vx *= -1;
        if (n.y < 0 || n.y > 256) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, active ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        nodes.slice(i + 1).forEach(n2 => {
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        });
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [active]);

  return <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />;
}
