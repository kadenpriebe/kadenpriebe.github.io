import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getBlogPosts, getPostBySlug } from "@/lib/blog";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <Container>
      <Section className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 ring-1 ring-black/5 transition hover:ring-black/10"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4 stroke-brand-muted group-hover:stroke-brand-text transition">
            <path d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        
        <article>
          <header className="flex flex-col">
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
              {post.metadata.title}
            </h1>
            <time
              dateTime={post.metadata.date}
              className="order-first flex items-center text-base text-brand-muted"
            >
              <span className="h-4 w-0.5 rounded-full bg-black/10 mr-3" />
              {format(parseISO(post.metadata.date), "MMMM d, yyyy")}
            </time>
          </header>

          <div className="mt-8 prose prose-slate max-w-none">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </Section>
    </Container>
  );
}
