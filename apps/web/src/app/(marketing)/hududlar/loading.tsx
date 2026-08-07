import { Skeleton } from '@imkon/ui';

/** /hududlar yuklanish holati — docs/design/README.md majburiy holat qoidasi. Sarlavha
 * + hudud kartalari shaklini takrorlaydi (ichki natijalar o'z Suspense/
 * RegionsSkeleton chegarasiga ega — bu segment darajasidagi BIRINCHI
 * yuklanish uchun). */
export default function RegionsLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Hududlar sahifasi yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
            <Skeleton className="h-3 w-24 bg-deep-fg/10" />
            <Skeleton className="mt-3 h-8 w-2/3 bg-deep-fg/10" />
            <Skeleton className="mt-4 h-4 w-full max-w-2xl bg-deep-fg/10" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-7 w-1/3" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                <div className="flex flex-col gap-2 border-t border-line pt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
