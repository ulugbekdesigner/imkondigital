import { Skeleton } from '@imkon/ui';

/** /kurslar yuklanish holati — docs/design/README.md majburiy holat qoidasi. Sahifa
 * navigatsiya orqali kelganda (masalan filtr almashtirilganda to'liq
 * segment qayta yuklansa) shu ko'rsatiladi; ichki natijalar ro'yxati
 * o'zining Suspense/CatalogSkeleton chegarasiga ega. */
export default function KurslarLoading() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10">
      <span className="sr-only" role="status">
        Kurslar katalogi yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-12 w-full rounded-full sm:w-[380px]" />
        </div>
        <Skeleton className="h-[74px] w-full rounded-xl" />
        <ul className="mt-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper">
              <Skeleton className="h-[116px] w-full rounded-none" />
              <div className="flex flex-col gap-2 p-[18px]">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
