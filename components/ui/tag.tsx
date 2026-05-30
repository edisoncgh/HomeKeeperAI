import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

type TagTone = "neutral" | "success" | "warning" | "danger";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  leadingIcon?: ReactNode;
  tone?: TagTone;
}

const toneClasses: Record<TagTone, string> = {
  neutral: "border-soft-border bg-surface text-text-secondary",
  success: "border-primary/25 bg-primary-light text-primary",
  warning: "border-warning/25 bg-[#FFF5E8] text-[#A75B15]",
  danger: "border-danger/25 bg-[#FDEDEC] text-danger"
};

export function Tag({ children, className, leadingIcon, tone = "neutral", ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
    </span>
  );
}
