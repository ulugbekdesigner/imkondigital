import { Skeleton, StatCardSkeleton } from '@imkon/ui';

/** /admin (boshqaruv paneli) yuklanayotganda — KPI panjarasi, grafik+navbat
 * qatori va ikkita 2-ustunli navbat panjarasi bo'yicha skelet, haqiqiy
 * sahifa (page.tsx) joylashuviga mos. */
export default function AdminDashboardLoading() {
  return (
    <div className="max-w-6xl">
      <span className="sr-only" role="status">
        Boshqaruv paneli yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="mb-8 flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="mb-8">
          <StatCardSkeleton count={8} />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>

        {Array.from({ length: 2 }).map((_, gridIdx) => (
          <div key={gridIdx} className="mb-2 grid gap-6 lg:grid-cols-2">
            {[0, 1].map((col) => (
              <div key={col} className="flex flex-col gap-3">
                <Skeleton className="h-5 w-40" />
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
