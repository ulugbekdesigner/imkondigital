/* Nomzodlar sahifasi — arizachilar ro'yxati serverdan kelayotganda
   ko'rsatiladigan skelet (App Router loading.tsx), .imk-skeleton bilan. */
export default function ApplicantsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" aria-busy="true" aria-label="Yuklanmoqda">
      <span className="imk-skeleton w-40" />

      <div className="mt-3 flex flex-col gap-2">
        <span className="imk-skeleton w-64" />
        <span className="imk-skeleton w-48" />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-mint p-4">
        <div className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-surface-2" />
        <span className="imk-skeleton w-full" />
      </div>

      <div className="mt-6 overflow-hidden rounded-[20px] border border-line bg-paper">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3.5 border-t border-line p-4 first:border-t-0 sm:p-[18px]">
            <div className="h-10 w-10 shrink-0 rounded-full bg-surface-2" />
            <div className="flex min-w-[10rem] flex-1 flex-col gap-2">
              <span className="imk-skeleton w-2/5" />
              <span className="imk-skeleton w-1/4" />
            </div>
            <div className="h-6 w-16 rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
