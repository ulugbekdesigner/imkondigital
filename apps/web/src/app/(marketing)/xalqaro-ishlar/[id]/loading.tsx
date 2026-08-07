import { Skeleton } from '@imkon/ui';

/** /xalqaro-ishlar/[id] yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Quyuq sarlavha zonasi + tavsif ustuni shaklini takrorlaydi. */
export default function ExternalJobDetailLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Ish e&apos;loni yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-2xl px-4 py-10">
            <Skeleton className="h-3 w-48 bg-deep-fg/10" />
            <div className="mt-6 flex items-start gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-deep-fg/10" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-24 rounded-full bg-deep-fg/10" />
                  <Skeleton className="h-5 w-20 rounded-full bg-deep-fg/10" />
                </div>
                <Skeleton className="mt-3 h-7 w-2/3 bg-deep-fg/10" />
                <Skeleton className="mt-2 h-4 w-1/2 bg-deep-fg/10" />
              </div>
              <Skeleton className="h-14 w-14 shrink-0 rounded-full bg-deep-fg/10" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-xl border border-line bg-paper p-6">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-5/6" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
          <Skeleton className="mt-8 h-32 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
