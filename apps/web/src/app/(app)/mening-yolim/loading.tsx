import { Skeleton } from '@imkon/ui';

/** "Mening yo'lim" yuklanish holati — docs/design/README.md majburiy holat qoidasi
 * (har ekran: yuklanmoqda/bo'sh/xato/qulflangan). Layout hero/KPI/kartalar
 * o'lchamiga mos shimmer-bloklar, hech qachon bo'sh oq ekran ko'rsatilmasin. */
export default function MeningYolimLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <span className="sr-only" role="status">
        Mening yo&apos;lim yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <Skeleton className="h-[132px] w-full rounded-[22px]" />

        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-card" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-[180px] w-full rounded-xl" />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
