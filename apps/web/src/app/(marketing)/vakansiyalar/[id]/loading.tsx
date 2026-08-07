import { Skeleton } from '@imkon/ui';

/** /vakansiyalar/[id] yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Quyuq sarlavha zonasi + tavsif ustuni + ariza paneli shaklini takrorlaydi. */
export default function VacancyDetailLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Vakansiya yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <Skeleton className="h-3 w-48 bg-deep-fg/10" />
            <div className="mt-6 flex items-start gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-deep-fg/10" />
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded bg-deep-fg/10" />
                  <Skeleton className="h-5 w-24 rounded-full bg-deep-fg/10" />
                </div>
                <Skeleton className="mt-3 h-7 w-2/3 bg-deep-fg/10" />
                <Skeleton className="mt-2 h-4 w-1/3 bg-deep-fg/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
            <div className="flex flex-col gap-8">
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-5/6" />
              </div>
              <div>
                <Skeleton className="h-5 w-56" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
