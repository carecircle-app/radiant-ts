// src/components/ui/Card.tsx
import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

// Reusable, server-friendly Card wrapper
export default function Card({ children, className = "" }: Props) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

