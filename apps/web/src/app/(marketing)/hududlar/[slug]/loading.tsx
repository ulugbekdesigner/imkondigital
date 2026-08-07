import { Skeleton } from '@imkon/ui';

/** /hududlar/[slug] yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Yo'l xaritasi, 4 statistika kartasi va vakansiya ro'yxati shaklini
 * takrorlaydi. */
export default function RegionDetailLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Hudud ma&apos;lumotlari yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
            <Skeleton className="h-3 w-16 bg-deep-fg/10" />
            <Skeleton className="mt-3 h-8 w-1/2 bg-deep-fg/10" />
            <Skeleton className="mt-4 h-4 w-full max-w-2xl bg-deep-fg/10" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12">
          <Skeleton className="h-3 w-32" />

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-paper p-5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-7 w-16" />
              </div>
            ))}
          </dl>

          <div className="mt-10 flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="mt-1 h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
