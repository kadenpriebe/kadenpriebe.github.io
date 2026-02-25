import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllProjects } from "@/lib/projects";
import * as motion from "framer-motion/client";
import { Sticker } from "@/components/ui/sticker";

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <Container className="relative overflow-hidden">
      {/* Background Stickers */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
        <Sticker initialX={80} initialY={120} rotation={-10} className="top-20 left-10 opacity-60">🏗️</Sticker>
        <Sticker initialX={-120} initialY={280} rotation={15} className="top-60 right-20 opacity-60">🚀</Sticker>
        <Sticker initialX={150} initialY={600} rotation={-5} className="bottom-40 left-30 opacity-60">🧪</Sticker>
      </div>

      <Section className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
            what i've built
          </h1>
          <p className="mt-6 text-xl text-brand-muted max-w-2xl">
            A collection of projects, experiments, and tools.
            Some for fun, some for learning, some actually useful.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {projects.length > 0 ? (
            projects.map((project, idx) => (
              <motion.article 
                key={project.slug} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="group relative flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:border-amber-200 hover:shadow-md transition-all h-full"
              >
                <time dateTime={project.date} className="text-sm text-brand-muted mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                  {format(parseISO(project.date), "yyyy")}
                </time>
                <h2 className="text-xl font-bold font-heading text-brand-text mb-2 group-hover:text-amber-700 transition-colors">
                  <Link href={`/projects/${project.slug}`}>
                    <span className="absolute inset-0" />
                    {project.title}
                  </Link>
                </h2>
                <p className="text-base text-brand-muted mb-6 line-clamp-3 flex-1 leading-relaxed">
                  {project.description}
                </p>
                
                {project.tags && (
                  <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-[10px] font-bold text-brand-muted">+{project.tags.length - 3}</span>
                    )}
                  </div>
                )}
                
                <div aria-hidden="true" className="relative z-10 mt-6 flex items-center text-sm font-medium text-amber-600 group-hover:translate-x-1 transition-transform">
                  Explore project
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="ml-1 h-4 w-4 stroke-current">
                    <path d="M6.75 5.75 9.25 8l-2.5 2.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="col-span-full text-brand-muted p-12 text-center border-2 border-dashed border-black/5 rounded-3xl">
              Projects coming soon...
            </div>
          )}
        </div>
      </Section>
    </Container>
  );
}
