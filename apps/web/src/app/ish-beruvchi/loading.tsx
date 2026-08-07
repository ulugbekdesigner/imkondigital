/* Ish beruvchi boshqaruv paneli — server komponent ma'lumot yuklayotganda
   Next.js avtomatik shu skeletonni ko'rsatadi (App Router loading.tsx).
   Shakl EmployerDashboardPage bilan bir xil: 3 KPI karta + vakansiyalar
   ro'yxati, parts.css dagi .imk-skeleton (shimmer 1.6s, 14px chiziq) bilan
   — balandlik o'zgartirilmaydi (klass qoidasi bilan to'qnashmasin uchun),
   faqat kenglik va joylashuv o'zgaradi. */
export default function EmployerDashboardLoading() {
  return (
    <div className="max-w-4xl" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="imk-skeleton w-52" />
          <span className="imk-skeleton w-72" />
        </div>
        <div className="flex h-11 w-36 items-center rounded-full border border-line px-4">
          <span className="imk-skeleton w-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[18px] border border-line bg-paper p-4">
            <span className="imk-skeleton w-4/5" />
            <span className="imk-skeleton w-10" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <span className="imk-skeleton w-36" />
        <div className="mt-3 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-[52px] items-center gap-3 rounded-lg border border-line bg-paper px-4"
            >
              <span className="imk-skeleton w-3/5" />
              <span className="imk-skeleton ml-auto w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
