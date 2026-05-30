import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  leadingIcon?: ReactNode;
}

export function Input({
  className,
  error,
  helperText,
  id,
  label,
  leadingIcon,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const helperId = helperText && inputId ? `${inputId}-helper` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-text-primary">{label}</span> : null}
      <span className="relative flex items-center">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 text-text-tertiary">{leadingIcon}</span>
        ) : null}
        <input
          aria-describedby={errorId ?? helperId}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-11 w-full rounded-card border bg-surface px-3 text-sm text-text-primary transition",
            "placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light",
            leadingIcon ? "pl-10" : undefined,
            error ? "border-danger" : "border-soft-border",
            className
          )}
          id={inputId}
          {...props}
        />
      </span>
      {error ? (
        <span className="text-xs text-danger" id={errorId}>
          {error}
        </span>
      ) : null}
      {!error && helperText ? (
        <span className="text-xs text-text-tertiary" id={helperId}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
