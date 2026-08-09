import { Skeleton, StatCardSkeleton } from '@imkon/ui';

/** /donor yuklanayotganda - KPI kartalari + dasturlar/loyihalar ro'yxati skeleti. */
export default function DonorDashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <span className="sr-only" role="status">
        Donor paneli yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="mb-8 flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="mb-8">
          <StatCardSkeleton count={4} />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-touch items-center justify-between gap-3 rounded border border-line px-4 py-3"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
