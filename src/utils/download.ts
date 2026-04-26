export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getFilenameFromDisposition(headerValue?: string | null, fallback = "download") {
  if (!headerValue) return fallback;
  const match = headerValue.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}
