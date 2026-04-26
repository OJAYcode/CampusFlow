import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { cn } from "@/src/utils/cn";

type StatTone = "primary" | "info" | "warning" | "success" | "danger";

const toneStyles: Record<StatTone, { badge: string; iconSurface: string; iconText: string }> = {
  primary: {
    badge: "bg-[#3d5ee1] text-white",
    iconSurface: "bg-[#f2f5ff]",
    iconText: "text-[#3d5ee1]",
  },
  info: {
    badge: "bg-[#05c3fb] text-white",
    iconSurface: "bg-[#e8f8ff]",
    iconText: "text-[#05c3fb]",
  },
  warning: {
    badge: "bg-[#eab300] text-white",
    iconSurface: "bg-[#fef8ea]",
    iconText: "text-[#eab300]",
  },
  success: {
    badge: "bg-[#1abe17] text-white",
    iconSurface: "bg-[#e8f9e8]",
    iconText: "text-[#1abe17]",
  },
  danger: {
    badge: "bg-[#e82646] text-white",
    iconSurface: "bg-[#fde9ed]",
    iconText: "text-[#e82646]",
  },
};

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "danger",
  activeValue,
  inactiveValue,
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: StatTone;
  activeValue?: string | number;
  inactiveValue?: string | number;
}) {
  const styles = toneStyles[tone];
  const showBreakdown = activeValue !== undefined || inactiveValue !== undefined;

  return (
    <Card className="overflow-hidden rounded-[20px] border-[#e7edf5] bg-white shadow-[0_12px_30px_rgba(15,37,71,0.06)]">
      <CardHeader className="space-y-0 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("grid h-11 w-11 place-items-center rounded-[14px] sm:h-[56px] sm:w-[56px] sm:rounded-[16px]", styles.iconSurface, styles.iconText)}>
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-[13px] font-medium leading-5 text-[#6a738a] sm:text-sm">{title}</CardTitle>
            <div className="mt-1.5 text-[1.45rem] font-semibold leading-none tracking-[-0.04em] text-[#202c4b] sm:mt-2 sm:text-[2rem]">{value}</div>
          </div>
        </div>
        {helper ? (
          <span
            className={cn(
              "mt-3 inline-flex max-w-full rounded-[14px] px-2.5 py-1.5 text-[10px] font-semibold leading-[1.35] whitespace-normal break-words sm:mt-4 sm:rounded-[16px] sm:px-3 sm:py-2 sm:text-[11px]",
              styles.badge,
            )}
          >
            {helper}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
        {showBreakdown ? (
          <div className="border-t border-[var(--border)] pt-3 sm:pt-4">
            <div className="flex flex-wrap items-center gap-3 text-[13px] sm:gap-4 sm:text-sm">
              {activeValue !== undefined ? (
                <p className="text-[#515b73]">
                  Active: <span className="font-semibold text-[#202c4b]">{activeValue}</span>
                </p>
              ) : null}
              {activeValue !== undefined && inactiveValue !== undefined ? (
                <span className="h-4 w-px bg-[var(--border)]" />
              ) : null}
              {inactiveValue !== undefined ? (
                <p className="text-[#515b73]">
                  Inactive: <span className="font-semibold text-[#202c4b]">{inactiveValue}</span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
