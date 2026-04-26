import { Button } from "@/src/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-[var(--border)] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,37,71,0.05)]">
      <p className="text-sm text-[#515b73]">
        Page {page} of {totalPages || 1}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onPrevious} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
