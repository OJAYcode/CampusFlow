import type { ReactNode } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/src/components/ui/empty-state";
import { cn } from "@/src/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyTitle,
  emptyDescription,
}: {
  columns: Array<Column<T>>;
  data: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const isMobile = useIsMobile();

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle || "No records found"}
        description={emptyDescription || "There is no data to show right now."}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, rowIndex) => (
          <div
            key={rowIndex}
            className="glass-panel rounded-[18px] border border-[var(--border)] p-4 shadow-[0_12px_28px_rgba(15,37,71,0.05)]"
          >
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7285]">
                    {column.header}
                  </p>
                  <div className={cn("text-sm text-[#515b73]", column.className)}>{column.render(item)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[20px] border border-[var(--border)] shadow-[0_12px_28px_rgba(15,37,71,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full table-auto text-left">
          <thead className="sticky top-0 z-[1] bg-[#f7f9fc] text-[#202c4b]">
            <tr className="border-b border-[var(--border)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-normal text-[#6b7285]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t border-[var(--border)] transition hover:bg-[#f8fbff]",
                  rowIndex % 2 === 0 ? "bg-white" : "bg-[#fcfdff]",
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-5 py-4 align-top text-sm whitespace-normal break-words text-[#515b73]", column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
