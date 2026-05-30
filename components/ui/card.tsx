import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-card border border-soft-border bg-surface p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-text-primary", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className, ...props }: CardProps) {
  return (
    <p className={cn("text-sm leading-6 text-text-secondary", className)} {...props}>
      {children}
    </p>
  );
}
