import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/src/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-none hover:bg-[#1f4fb7]",
  secondary:
    "border border-[var(--border)] bg-white text-[var(--secondary-foreground)] shadow-none hover:border-[#cddbf8] hover:bg-[#eef4ff] hover:text-[#1f4fb7]",
  ghost: "bg-transparent text-[var(--secondary-foreground)] hover:bg-[#eef4ff] hover:text-[#1f4fb7]",
  danger: "bg-[var(--danger)] text-white shadow-none hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-[13px] md:min-h-8",
  md: "min-h-10 px-4 py-2 text-sm md:min-h-[38px]",
  lg: "min-h-10 px-5 py-2.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded-[var(--radius)] text-center font-medium leading-tight whitespace-normal break-words transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
