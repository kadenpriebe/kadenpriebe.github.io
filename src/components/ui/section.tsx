import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}

export function Section({ children, className = "", as: Component = "section" }: SectionProps) {
  return (
    <Component className={`py-12 md:py-24 ${className}`}>
      {children}
    </Component>
  );
}
