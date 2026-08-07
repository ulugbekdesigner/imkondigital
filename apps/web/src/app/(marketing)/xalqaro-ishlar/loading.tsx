import { Skeleton } from '@imkon/ui';

/** /xalqaro-ishlar yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Sarlavha + karta grid shaklini takrorlaydi (ichki natijalar o'z Suspense/
 * ExternalJobsSkeleton chegarasiga ega — bu segment darajasidagi BIRINCHI
 * yuklanish uchun). */
export default function ExternalJobsLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Xalqaro ishlar sahifasi yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
            <Skeleton className="h-3 w-32 bg-deep-fg/10" />
            <Skeleton className="mt-3 h-8 w-2/3 bg-deep-fg/10" />
            <Skeleton className="mt-4 h-4 w-full max-w-2xl bg-deep-fg/10" />
            <Skeleton className="mt-1 h-4 w-4/5 max-w-2xl bg-deep-fg/10" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12">
          <Skeleton className="h-4 w-40" />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
