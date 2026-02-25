import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import Link from "next/link";
import { Sticker } from "@/components/ui/sticker";

export default function NowPage() {
  const lastUpdated = "February 2026";

  return (
    <Container className="relative overflow-hidden">
      {/* Background Stickers */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
        <Sticker initialX={150} initialY={80} rotation={12} className="top-10 left-20 opacity-60">📚</Sticker>
        <Sticker initialX={-80} initialY={250} rotation={-8} className="top-40 right-10 opacity-60">🎧</Sticker>
        <Sticker initialX={120} initialY={550} rotation={20} className="bottom-20 left-10 opacity-60">☕</Sticker>
        <Sticker initialX={-200} initialY={400} rotation={-15} className="bottom-40 right-20 opacity-60">✍️</Sticker>
      </div>

      <Section className="relative z-10">
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            ← back home
          </Link>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            what i'm up to right now
          </h1>
          <div className="flex items-center gap-4 text-brand-muted">
            <p className="text-xl">
              A snapshot of my life, updated whenever things change.
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NowCard 
            title="Research" 
            label="Cancer Biology Lab" 
            color="emerald"
          >
            <p>Gene expression patterns in MCF7 cell lines. Running assays, analyzing data, learning how cells make decisions under stress.</p>
          </NowCard>

          <NowCard 
            title="Coursework" 
            label="Spring 2026" 
            color="emerald"
          >
            <ul className="space-y-1.5">
              <li className="flex gap-2"><span>📚</span> CS 3780 — Intro to ML</li>
              <li className="flex gap-2"><span>🧬</span> Genetics & Molecular Bio</li>
              <li className="flex gap-2"><span>🧠</span> Deep Learning Study</li>
            </ul>
          </NowCard>

          <NowCard 
            title="Building" 
            label="Side Projects" 
            color="emerald"
          >
            <p>This website (Next.js), a Cornell course planner, and neural decoding from calcium imaging data.</p>
          </NowCard>

          <NowCard 
            title="Creating" 
            label="YouTube" 
            color="emerald"
          >
            <p>Videos about college, coding, and the intersection of biology and tech. Growing slowly but genuinely.</p>
          </NowCard>

          <NowCard 
            title="Reading" 
            label="Papers & Books" 
            color="emerald"
          >
            <p>Attention mechanisms in transformers. Cancer biology review papers for lab.</p>
          </NowCard>

          <NowCard 
            title="Listening" 
            label="Currently on repeat" 
            color="emerald"
          >
            <p>Lots of lo-fi for focus, but also been digging some acoustic folk lately.</p>
          </NowCard>
        </div>
      </Section>
    </Container>
  );
}

function NowCard({ 
  title, 
  label, 
  children, 
  color 
}: { 
  title: string; 
  label: string; 
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="p-6 bg-white border border-black/5 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all group flex flex-col h-full">
      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">{title}</div>
      <h3 className="text-lg font-bold mb-3 group-hover:text-emerald-700 transition-colors">{label}</h3>
      <div className="text-brand-muted text-[15px] leading-relaxed flex-1">
        {children}
      </div>
    </div>
  );
}
