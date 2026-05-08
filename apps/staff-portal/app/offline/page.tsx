export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="max-w-md rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-[0_18px_44px_rgba(47,50,125,0.08)]">
        <p className="heading-kicker text-[#255ac8]">Offline mode</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)]">You&apos;re offline</h1>
        <p className="mt-3 text-sm leading-6 text-[#66708a]">
          CampusFlow is still available in a limited offline state. Reconnect to refresh your latest data.
        </p>
      </div>
    </div>
  );
}
