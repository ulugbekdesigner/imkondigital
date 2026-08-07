import { Skeleton } from '@imkon/ui';

/** /ustoz (mentorlik) sahifasi yuklanayotganda — haqiqiy tarkib shakli
 * (avatar+sarlavha, keyin ikkita ro'yxat kartasi) bo'yicha skelet. */
export default function UstozLoading() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10">
      <span className="sr-only" role="status">
        Mentorlik sahifasi yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>

        {[0, 1].map((section) => (
          <div key={section} className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-paper p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-2/3" />
            <div className="mt-2 flex flex-col gap-2">
              {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-3 rounded border border-line px-3 py-2">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
