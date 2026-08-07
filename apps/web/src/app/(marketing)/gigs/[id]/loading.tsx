/* Xizmat tafsiloti sahifasi — freelancer ma'lumoti va buyurtma formasi
   serverdan kelayotganda ko'rsatiladigan skelet (App Router loading.tsx),
   .imk-skeleton bilan. */
export default function GigDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <div className="bg-deep">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <span className="imk-skeleton w-24" />
          <div className="mt-3 flex flex-col gap-2">
            <span className="imk-skeleton w-3/4" />
            <span className="imk-skeleton w-1/2" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-full bg-deep-fg/15" />
            <span className="imk-skeleton w-32" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="imk-skeleton w-40" />
            <span className="imk-skeleton w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-2">
            <span className="imk-skeleton w-24" />
            <span className="imk-skeleton w-full" />
            <span className="imk-skeleton w-full" />
            <span className="imk-skeleton w-2/3" />
          </div>
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-mint p-4">
            <span className="imk-skeleton w-1/2" />
            <span className="imk-skeleton w-full" />
            <div className="h-11 w-32 rounded-full bg-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
