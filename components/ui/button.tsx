import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/class-names";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-[#43AA7F]",
  secondary: "border border-primary bg-surface text-primary hover:bg-primary-light",
  ghost: "bg-transparent text-text-secondary hover:bg-primary-light hover:text-text-primary",
  danger: "bg-danger text-white shadow-sm hover:bg-[#D64C49]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "size-11 justify-center p-0"
};

export function Button({
  children,
  className,
  disabled,
  leadingIcon,
  size = "md",
  trailingIcon,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-card font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
