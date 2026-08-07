export default function Loading() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10">
      <span className="imk-skeleton" style={{ width: 160, height: 16 }} />

      <div className="mt-4 flex items-center gap-4">
        <span className="imk-skeleton shrink-0 rounded-full" style={{ width: 56, height: 56 }} />
        <div className="flex flex-1 flex-col gap-2">
          <span className="imk-skeleton" style={{ width: '30%', height: 10 }} />
          <span className="imk-skeleton" style={{ width: '55%', height: 22 }} />
        </div>
      </div>

      <span className="imk-skeleton mt-4" style={{ width: '45%', height: 12 }} />

      <div
        role="status"
        aria-label="Yuklanmoqda…"
        className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-paper p-6"
      >
        <span className="imk-skeleton" style={{ width: '35%', height: 18 }} />
        <span className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 12 }} />
        <span className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 12 }} />
      </div>
    </div>
  );
}
