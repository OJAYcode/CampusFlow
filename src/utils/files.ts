function getApiOrigin() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:10000/api/v1";
  return apiBaseUrl.replace(/\/api\/v1\/?$/, "");
}

export function resolveFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (fileUrl.startsWith("/")) {
    return `${getApiOrigin()}${fileUrl}`;
  }
  return `${getApiOrigin()}/${fileUrl}`;
}
