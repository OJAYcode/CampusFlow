import { cn } from "@/src/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[5px] bg-slate-200", className)} />;
}
