import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getBlogPosts } from "@/lib/blog";
import * as motion from "framer-motion/client";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <Container>
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
            random thoughts
          </h1>
          <p className="mt-6 text-xl text-brand-muted max-w-2xl">
            Writing about software, design, and whatever else is on my mind. 
            Usually minimalist, sometimes coherent.
          </p>
        </motion.div>

        <div className="mt-12 space-y-16">
          {posts.length > 0 ? (
            posts.map((post, idx) => (
              <motion.article 
                key={post.slug} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (idx + 1) }}
                className="group relative flex flex-col items-start"
              >
                <h2 className="text-2xl font-bold font-heading tracking-tight text-brand-text group-hover:text-brand-muted transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute -inset-x-4 -inset-y-6 z-20 sm:-inset-x-6 sm:rounded-2xl" />
                    <span className="relative z-10">{post.title}</span>
                  </Link>
                </h2>
                <time 
                  dateTime={post.date}
                  className="relative z-10 order-first mb-3 flex items-center text-sm text-brand-muted pl-3.5"
                >
                  <span className="absolute inset-y-0 left-0 flex items-center" aria-hidden="true">
                    <span className="h-4 w-0.5 rounded-full bg-indigo-200" />
                  </span>
                  {format(parseISO(post.date), "MMMM d, yyyy")}
                </time>
                <p className="relative z-10 mt-2 text-base text-brand-muted">
                  {post.description}
                </p>
                <div aria-hidden="true" className="relative z-10 mt-4 flex items-center text-sm font-medium text-brand-text group-hover:text-indigo-600 transition-colors">
                  Read post
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="ml-1 h-4 w-4 stroke-current">
                    <path d="M6.75 5.75 9.25 8l-2.5 2.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.article>
            ))
          ) : (
            <p className="text-brand-muted">No posts found. Check back later!</p>
          )}
        </div>
      </Section>
    </Container>
  );
}
