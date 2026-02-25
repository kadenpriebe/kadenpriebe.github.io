"use client";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sticker } from "@/components/ui/sticker";

export default function AboutPage() {
  return (
    <Container className="relative overflow-hidden">
      {/* Background Stickers */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
        <Sticker initialX={100} initialY={100} rotation={-15} className="top-10 left-10 opacity-60">🔬</Sticker>
        <Sticker initialX={-50} initialY={300} rotation={10} className="top-40 right-20 opacity-60">💻</Sticker>
        <Sticker initialX={200} initialY={600} rotation={-5} className="bottom-20 left-40 opacity-60">🧬</Sticker>
        <Sticker initialX={-150} initialY={500} rotation={15} className="bottom-40 right-40 opacity-60">🎬</Sticker>
      </div>

      <Section className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <Link 
            href="/" 
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            ← back home
          </Link>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
            who's this guy?
          </h1>
          <p className="text-xl text-brand-muted">
            The short version: curious about everything, building to learn.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-col md:flex-row gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full md:w-40 aspect-[4/5] bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 font-medium shrink-0 border border-cyan-100"
          >
            photo
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-1 space-y-6 text-lg leading-relaxed text-brand-muted"
          >
            <p>
              I'm <strong className="text-brand-text">Kaden Priebe</strong>, a student at Cornell studying at the intersection of biology and computation. By day I'm in the lab working on cancer research — by night I'm building side projects, making <Link href="#" className="text-cyan-600 hover:underline">YouTube videos</Link>, and probably debugging something that should've worked the first time.
            </p>
            <p>
              I got into research through a genuine curiosity about how cells make decisions — how a tumor cell "decides" to metastasize, how gene regulatory networks coordinate. That same curiosity drives everything else I do.
            </p>
            <p>
              I believe the best way to learn something is to build something with it. This site is proof of that philosophy.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100">Cornell '28</span>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100">Researcher</span>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100">Creator</span>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100">Builder</span>
            </div>
          </motion.div>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 px-6 lg:px-0 max-w-5xl mx-auto">
        <div className="p-6 bg-cyan-50/50 rounded-2xl border border-cyan-100/50">
          <h3 className="font-heading font-bold text-cyan-900 mb-3">What I do</h3>
          <ul className="space-y-2 text-sm text-cyan-800/80">
            <li className="flex gap-2"><span>🔬</span> Cancer genomics research</li>
            <li className="flex gap-2"><span>💻</span> Full-stack web dev (Next.js)</li>
            <li className="flex gap-2"><span>🎬</span> Education-focused YouTube</li>
            <li className="flex gap-2"><span>🧠</span> Machine learning for bio</li>
          </ul>
        </div>
        <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50">
          <h3 className="font-heading font-bold text-amber-900 mb-3">The Kit</h3>
          <ul className="space-y-2 text-sm text-amber-800/80">
            <li className="flex gap-2"><span>💻</span> M2 MacBook Air</li>
            <li className="flex gap-2"><span>⌨️</span> Keychron K2 (Browns)</li>
            <li className="flex gap-2"><span>📷</span> Sony ZV-E10</li>
            <li className="flex gap-2"><span>🎧</span> Sony WH-1000XM4</li>
          </ul>
        </div>
        <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100/50">
          <h3 className="font-heading font-bold text-rose-900 mb-3">Fun Facts</h3>
          <ul className="space-y-2 text-sm text-rose-800/80">
            <li className="flex gap-2"><span>☕</span> Addicted to flat whites</li>
            <li className="flex gap-2"><span>🏃</span> Former track runner</li>
            <li className="flex gap-2"><span>📚</span> Reads 2-3 books at once</li>
            <li className="flex gap-2"><span>🎸</span> Learning classical guitar</li>
          </ul>
        </div>
      </div>

      <Section className="border-t border-black/5 mt-12 pt-12">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-heading text-2xl font-bold flex items-center gap-3 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
          the story so far
        </motion.h2>
        
        <div className="relative border-l-2 border-cyan-50 ml-3 pl-8 space-y-12">
          <TimelineItem 
            year="2024 — Present"
            title="Cornell University"
            description="Studying biology with a computational focus. Working in a cancer biology lab on tumor microenvironments and gene expression patterns."
          />
          <TimelineItem 
            year="2023"
            title="Started Building"
            description="First side projects, first YouTube videos, first time realizing that building things is the best way to learn."
          />
          <TimelineItem 
            year="2022"
            title="Research Spark"
            description="Summer research program that changed everything — the intersection of biology and computation."
          />
        </div>
      </Section>
    </Container>
  );
}

function TimelineItem({ year, title, description }: { year: string, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-600 border-4 border-white" />
      <div className="text-sm font-bold text-cyan-600 uppercase tracking-wider mb-1">{year}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-brand-muted max-w-2xl">
        {description}
      </p>
    </motion.div>
  );
}
