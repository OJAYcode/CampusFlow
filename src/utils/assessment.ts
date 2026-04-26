export function getRemainingSeconds(endAt: Date | string) {
  const end = new Date(endAt).getTime();
  return Math.max(Math.floor((end - Date.now()) / 1000), 0);
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
