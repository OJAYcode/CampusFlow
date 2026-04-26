export function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleCase(input: string) {
  return input
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
