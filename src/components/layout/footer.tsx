import { Container } from "@/components/ui/container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/[0.05] py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-brand-muted">
            © {currentYear} kaden priebe. built with caffeine and curiosity.
          </p>
          <div className="flex gap-6 text-sm font-medium text-brand-muted">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text">github</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text">linkedin</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text">youtube</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
