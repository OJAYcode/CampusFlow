import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/src/utils/cn";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[6px] border border-[var(--input)] bg-white px-4 py-3 text-sm text-[#202c4b] outline-none transition placeholder:text-[#9ca1af] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
