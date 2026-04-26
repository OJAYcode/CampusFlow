import Link from "next/link";

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string; current?: boolean }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href && !item.current ? (
            <Link href={item.href} className="hover:text-[var(--primary)]">
              {item.label}
            </Link>
          ) : (
            <span className={item.current ? "font-semibold text-slate-900" : ""}>
              {item.label}
            </span>
          )}
          {index < items.length - 1 ? <span className="text-[var(--accent)]">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
