"use client";

import { cn } from "@/src/utils/cn";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[5px] border border-[var(--border)] bg-white p-2 shadow-[0_4px_9px_rgba(19,16,34,0.03)]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-[5px] border px-4 py-2 text-sm font-medium transition duration-200",
            value === tab.value
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-transparent text-[#515b73] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[#202c4b]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
