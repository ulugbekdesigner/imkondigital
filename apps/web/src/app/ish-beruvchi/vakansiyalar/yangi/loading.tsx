/* Yangi vakansiya sahifasi — hudud ro'yxati va kompaniya ma'lumoti
   serverdan kelayotganda ko'rsatiladigan skelet, .imk-skeleton bilan. */
export default function NewVacancyLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true" aria-label="Yuklanmoqda">
      <span className="imk-skeleton w-40" />

      <div className="mt-3 flex flex-col gap-2">
        <span className="imk-skeleton w-44" />
        <span className="imk-skeleton w-56" />
      </div>

      <div className="mt-5 flex flex-col gap-5 rounded-lg border border-line bg-paper p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-12 items-center rounded-full border border-line px-4">
            <span className="imk-skeleton w-1/2" />
          </div>
        ))}
        <div className="flex gap-3">
          <div className="flex h-12 flex-1 items-center justify-center rounded-full border border-line">
            <span className="imk-skeleton w-1/3" />
          </div>
          <div className="flex h-12 flex-1 items-center justify-center rounded-full border border-line">
            <span className="imk-skeleton w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
