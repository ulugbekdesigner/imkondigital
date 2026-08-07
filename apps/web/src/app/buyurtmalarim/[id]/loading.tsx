/* Buyurtma tafsiloti sahifasi — holat, bosqichlar, escrow va suhbat
   serverdan kelayotganda ko'rsatiladigan skelet (App Router loading.tsx),
   .imk-skeleton bilan. */
export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10" aria-busy="true" aria-label="Yuklanmoqda">
      <span className="imk-skeleton w-32" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="imk-skeleton w-56" />
          <span className="imk-skeleton w-32" />
        </div>
        <span className="imk-skeleton w-28" />
      </div>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 rounded-xl border border-line bg-paper p-5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
            <div className="flex flex-col gap-1.5">
              <span className="imk-skeleton w-24" />
              <span className="imk-skeleton w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-surface-2" />
            <span className="imk-skeleton w-16" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="imk-skeleton w-28" />
            <span className="imk-skeleton w-full" />
            <span className="imk-skeleton w-full" />
            <span className="imk-skeleton w-2/3" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
            <span className="imk-skeleton w-24" />
            <div className="flex flex-col gap-2">
              {[0, 1].map((i) => (
                <span key={i} className="imk-skeleton w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-paper p-4">
            <span className="imk-skeleton w-32" />
            <div className="mt-2">
              <span className="imk-skeleton w-24" />
            </div>
            <div className="mt-2">
              <span className="imk-skeleton w-full" />
            </div>
          </div>
          <div className="h-11 w-full rounded-full bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
