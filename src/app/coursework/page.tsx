import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllCoursework } from "@/lib/coursework";
import * as motion from "framer-motion/client";
import { Sticker } from "@/components/ui/sticker";

export default async function CourseworkPage() {
  const coursework = await getAllCoursework();

  return (
    <Container className="relative overflow-hidden">
      {/* Background Stickers */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
        <Sticker initialX={120} initialY={100} rotation={-12} className="top-10 left-20 opacity-60">📓</Sticker>
        <Sticker initialX={-100} initialY={300} rotation={8} className="top-40 right-10 opacity-60">🎓</Sticker>
        <Sticker initialX={180} initialY={550} rotation={-5} className="bottom-20 left-10 opacity-60">🧬</Sticker>
      </div>

      <Section className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
            classes & learning
          </h1>
          <p className="mt-6 text-xl text-brand-muted max-w-2xl leading-relaxed">
            A collection of interactive tools, projects, and notes from classes I'm taking.
            I'm building things to understand them better.
          </p>
        </motion.div>

        <div className="mt-12 space-y-16">
          {coursework.length > 0 ? (
            coursework.map((item, idx) => (
              <motion.article 
                key={item.slug} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="group relative flex flex-col items-start"
              >
                <div className="flex items-center gap-x-3 text-sm text-brand-muted mb-3 relative z-10">
                  <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">{item.course}</span>
                  <span className="h-4 w-px bg-black/10" />
                  <time dateTime={item.date} className="font-medium">
                    {format(parseISO(item.date), "MMMM d, yyyy")}
                  </time>
                </div>
                <h2 className="text-2xl font-bold font-heading tracking-tight text-brand-text group-hover:text-cyan-700 transition-colors">
                  <Link href={`/coursework/${item.slug}`}>
                    <span className="absolute -inset-x-4 -inset-y-6 z-20 sm:-inset-x-6 sm:rounded-2xl" />
                    <span className="relative z-10">{item.title}</span>
                  </Link>
                </h2>
                <p className="relative z-10 mt-2 text-base text-brand-muted leading-relaxed max-w-3xl">
                  {item.description}
                </p>
                <div aria-hidden="true" className="relative z-10 mt-4 flex items-center text-sm font-medium text-cyan-600 group-hover:translate-x-1 transition-transform">
                  Explore interactive tool
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="ml-1 h-4 w-4 stroke-current">
                    <path d="M6.75 5.75 9.25 8l-2.5 2.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.article>
            ))
          ) : (
            <p className="text-brand-muted p-12 text-center border-2 border-dashed border-black/5 rounded-3xl">
              No coursework found yet. I'm busy learning!
            </p>
          )}
        </div>
      </Section>
    </Container>
  );
}
