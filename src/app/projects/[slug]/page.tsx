import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <Container>
      <Section className="max-w-3xl mx-auto">
        <Link
          href="/projects"
          className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 ring-1 ring-black/5 transition hover:ring-black/10"
        >
          <ArrowLeft className="h-4 w-4 stroke-brand-muted group-hover:stroke-brand-text transition" />
        </Link>
        
        <article>
          <header className="flex flex-col mb-10">
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
              {project.metadata.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-base text-brand-muted mt-4">
              <time dateTime={project.metadata.date} className="flex items-center">
                <span className="h-4 w-0.5 rounded-full bg-brand-accent/40 mr-3" />
                {format(parseISO(project.metadata.date), "MMMM d, yyyy")}
              </time>
              
              {(project.metadata.link || project.metadata.github) && (
                <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 ml-2">
                  {project.metadata.link && (
                    <a href={project.metadata.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-accent transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      Visit Site
                    </a>
                  )}
                  {project.metadata.github && (
                    <a href={project.metadata.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-accent transition-colors">
                      <Github className="h-4 w-4" />
                      Source Code
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {project.metadata.tags && (
              <div className="flex flex-wrap gap-2 mt-6">
                {project.metadata.tags.map(tag => (
                  <span key={tag} className="text-sm px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand-muted font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-slate max-w-none prose-headings:font-heading prose-a:text-brand-accent hover:prose-a:underline prose-img:rounded-xl">
            <MDXRemote source={project.content} />
          </div>
        </article>
      </Section>
    </Container>
  );
}
