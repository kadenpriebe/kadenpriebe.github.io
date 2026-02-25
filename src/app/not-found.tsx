import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <Container>
      <Section className="flex flex-col items-center justify-center text-center min-h-[60vh]">
        <h1 className="font-heading text-6xl font-extrabold tracking-tighter sm:text-8xl">404</h1>
        <h2 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">Oops, you found a secret...</h2>
        <p className="mt-6 text-xl text-brand-muted max-w-md">
          ...that doesn't exist yet. Either I haven't built this page, or you're just really good at guessing URLs.
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-brand-text px-8 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-muted transition-colors"
          >
            back to safety
          </Link>
        </div>
      </Section>
    </Container>
  );
}
