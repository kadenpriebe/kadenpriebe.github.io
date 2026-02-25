import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import Link from "next/link";

export default function LinksPage() {
  return (
    <Container>
      <Section>
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            ← back home
          </Link>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
            let's talk
          </h1>
          <p className="text-xl text-brand-muted">
            I'm online in the usual places. I actually reply to emails.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          <LinkCard 
            title="YouTube" 
            description="Videos about college, coding, science. New uploads... eventually." 
            icon="📺" 
            href="#" 
          />
          <LinkCard 
            title="GitHub" 
            description="Open source projects and experiments." 
            icon="💻" 
            href="https://github.com/kadenpriebe" 
          />
          <LinkCard 
            title="LinkedIn" 
            description="The professional version of me. Same person, slightly more formal." 
            icon="💼" 
            href="#" 
          />
          <LinkCard 
            title="Email" 
            description="kaden@cornell.edu — reach out about anything. I read them all." 
            icon="✉️" 
            href="mailto:kaden@cornell.edu" 
          />
        </div>
      </Section>
    </Container>
  );
}

function LinkCard({ 
  title, 
  description, 
  icon, 
  href 
}: { 
  title: string; 
  description: string; 
  icon: string; 
  href: string;
}) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-6 bg-white border border-black/5 rounded-2xl hover:border-rose-200 hover:shadow-sm transition-all group"
    >
      <div className="text-2xl mr-6">{icon}</div>
      <div className="flex-1">
        <h3 className="text-lg font-bold group-hover:text-rose-600 transition-colors">{title}</h3>
        <p className="text-brand-muted text-sm">{description}</p>
      </div>
      <div className="text-rose-200 text-xl group-hover:text-rose-500 transition-colors">
        →
      </div>
    </a>
  );
}
