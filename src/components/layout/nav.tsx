"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";

const navLinks = [
  { href: "/about", label: "who's this guy?" },
  { href: "/projects", label: "what i've built" },
  { href: "/coursework", label: "classes" },
  { href: "/blog", label: "random thoughts" },
  { href: "/links", label: "let's talk" },
];

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide nav on home page to let the Playground take over
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/[0.05]">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight">
            kaden priebe
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:gap-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-brand-muted hover:text-brand-text focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-black/[0.05]">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-brand-muted hover:bg-black/[0.02] hover:text-brand-text"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
