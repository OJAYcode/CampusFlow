import type { InputHTMLAttributes } from "react";

import { cn } from "@/src/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-[38px] w-full rounded-[6px] border border-[var(--input)] bg-white px-3 text-sm text-[#202c4b] outline-none transition placeholder:text-[#9ca1af] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
