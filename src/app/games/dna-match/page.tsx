'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import Link from 'next/link';

type Base = 'A' | 'T' | 'C' | 'G';
const PAIRS: Record<Base, Base> = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
const BASES: Base[] = ['A', 'T', 'C', 'G'];

export default function DNAMatcher() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentBase, setCurrentBase] = useState<Base>('A');
  const [feedback, setFeedback] = useState<string | null>(null);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    generateNewBase();
  };

  const generateNewBase = useCallback(() => {
    const randomBase = BASES[Math.floor(Math.random() * BASES.length)];
    setCurrentBase(randomBase);
  }, []);

  const handleMatch = (guess: Base) => {
    if (gameState !== 'playing') return;

    if (PAIRS[currentBase] === guess) {
      setScore(s => s + 10);
      setFeedback('MATCH!');
      generateNewBase();
    } else {
      setScore(s => Math.max(0, s - 5));
      setFeedback('WRONG!');
    }

    setTimeout(() => setFeedback(null), 500);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState('finished');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <Container className="flex flex-col items-center justify-center min-h-[80vh]">
      <Section className="w-full max-w-xl text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3">
          <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block animate-pulse" />
          DNA Matcher
        </h1>
        <p className="text-brand-muted mb-12">Match the base pairs (A-T, C-G) as fast as you can. 30 seconds on the clock.</p>

        <div className="bg-white border-2 border-black/5 rounded-3xl p-12 shadow-sm relative overflow-hidden">
          {gameState === 'idle' && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-6xl animate-bounce">🧬</div>
              <button 
                onClick={startGame}
                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="flex flex-col items-center gap-8">
              <div className="flex justify-between w-full font-bold text-sm uppercase tracking-widest text-brand-muted">
                <span>Score: <span className="text-emerald-600">{score}</span></span>
                <span>Time: <span className={timeLeft < 10 ? "text-rose-500" : "text-brand-text"}>{timeLeft}s</span></span>
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentBase}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, y: -10 }}
                    className="text-8xl font-black text-brand-text font-heading"
                  >
                    {currentBase}
                  </motion.div>
                </AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -40 }}
                    className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${feedback === 'MATCH!' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {feedback}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                {BASES.map(base => (
                  <button 
                    key={base}
                    onClick={() => handleMatch(base)}
                    className="p-6 bg-zinc-50 border border-black/5 rounded-2xl font-black text-2xl hover:bg-zinc-100 active:scale-95 transition-all hover:border-emerald-200"
                  >
                    {base}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="text-sm font-bold uppercase tracking-widest text-brand-muted">Game Over!</div>
              <div className="text-6xl font-black font-heading text-brand-text">Score: {score}</div>
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={startGame}
                  className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Play Again
                </button>
                <Link 
                  href="/"
                  className="px-10 py-4 bg-white border border-black/5 text-brand-text font-bold rounded-2xl hover:bg-zinc-50 transition-all text-center"
                >
                  Back Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </Section>
    </Container>
  );
}
