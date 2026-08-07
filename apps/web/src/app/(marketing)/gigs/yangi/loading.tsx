/* Yangi xizmat qo'shish sahifasi — foydalanuvchi ma'lumoti serverdan
   kelayotganda ko'rsatiladigan skelet (App Router loading.tsx), .imk-skeleton
   bilan. */
export default function NewGigLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10" aria-busy="true" aria-label="Yuklanmoqda">
      <span className="imk-skeleton w-48" />

      <div className="mt-4 flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-surface-2" />
        <div className="flex flex-col gap-2">
          <span className="imk-skeleton w-56" />
          <span className="imk-skeleton w-64" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5 rounded-lg border border-line bg-paper p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <span className="imk-skeleton w-1/3" />
            <div className="flex h-11 items-center rounded border border-line px-3">
              <span className="imk-skeleton w-1/2" />
            </div>
          </div>
        ))}
        <div className="h-11 w-40 self-start rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
