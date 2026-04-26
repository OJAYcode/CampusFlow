import type { HTMLAttributes } from "react";

import { cn } from "@/src/utils/cn";

const toneStyles = {
  neutral: "bg-[#f6f8fb] text-[#515b73] border border-[#e7edf5]",
  success: "bg-[#edf9f0] text-[#2b8f2b] border border-transparent",
  warning: "bg-[#fff6e5] text-[#bf7b00] border border-transparent",
  danger: "bg-[#fdecef] text-[#e82646] border border-transparent",
  info: "bg-[#eef3ff] text-[#255ac8] border border-transparent",
};

export function Badge({
  className,
  tone = "info",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneStyles }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
