import type { HTMLAttributes } from "react";

import { cn } from "@/src/utils/cn";

const variantStyles = {
  info: "border-[#d7def8] bg-[#f2f5ff] text-[#3d5ee1]",
  success: "border-[#d6efd6] bg-[#ebf8eb] text-[#2f8d2f]",
  warning: "border-[#ffe0ac] bg-[#fff5e1] text-[#a76800]",
  danger: "border-[#f8ced6] bg-[#fdecef] text-[#c61f3f]",
};

export function Alert({
  className,
  variant = "info",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variantStyles }) {
  return (
    <div
      className={cn("rounded-[5px] border px-4 py-3 text-sm shadow-[0_4px_9px_rgba(19,16,34,0.03)]", variantStyles[variant], className)}
      {...props}
    />
  );
}
