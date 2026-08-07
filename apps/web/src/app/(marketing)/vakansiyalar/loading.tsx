import { Skeleton } from '@imkon/ui';

/** /vakansiyalar yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Sarlavha + filtr paneli + karta grid shaklini takrorlaydi. */
export default function VacanciesLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Vakansiyalar yuklanmoqda…
      </span>
      <div aria-hidden="true" className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>

        <Skeleton className="mt-8 h-[104px] w-full rounded-xl" />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="rounded-lg border border-line bg-paper p-5">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-5 w-4/5" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-1 h-3 w-2/3" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
