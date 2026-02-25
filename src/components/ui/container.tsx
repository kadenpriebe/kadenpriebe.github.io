import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto max-w-4xl px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
