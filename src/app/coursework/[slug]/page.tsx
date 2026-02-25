import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAllCoursework, getCourseworkBySlug } from "@/lib/coursework";
import PCAExplorer from "@/components/interactive/pca-explorer";

const components = {
  PCAExplorer,
};

interface CourseworkPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const coursework = await getAllCoursework();
  return coursework.map((item) => ({
    slug: item.slug,
  }));
}

export default async function CourseworkDetailPage({ params }: CourseworkPageProps) {
  const { slug } = await params;
  const item = await getCourseworkBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <Container>
      <Section className="max-w-3xl mx-auto">
        <Link
          href="/coursework"
          className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 ring-1 ring-black/5 transition hover:ring-black/10"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4 stroke-brand-muted group-hover:stroke-brand-text transition">
            <path d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        
        <article>
          <header className="flex flex-col">
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
              {item.metadata.title}
            </h1>
            <div className="order-first flex items-center text-base text-brand-muted">
              <span className="h-4 w-0.5 rounded-full bg-brand-accent/40 mr-3" />
              <span className="font-semibold text-brand-text mr-2">{item.metadata.course}</span>
              <span className="mx-2">•</span>
              {format(parseISO(item.metadata.date), "MMMM d, yyyy")}
            </div>
          </header>

          <div className="mt-8 prose prose-slate max-w-none prose-headings:font-heading prose-a:text-brand-accent hover:prose-a:underline">
            <MDXRemote source={item.content} components={components} />
          </div>
        </article>
      </Section>
    </Container>
  );
}
