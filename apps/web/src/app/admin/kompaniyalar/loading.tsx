import { Skeleton } from '@imkon/ui';

/** /admin/kompaniyalar yuklanayotganda — sarlavha, tasdiq filtrlari va
 * jadval qatorlari bo'yicha skelet. */
export default function AdminCompaniesLoading() {
  return (
    <div className="max-w-4xl">
      <span className="sr-only" role="status">
        Kompaniyalar ro&apos;yxati yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-0 overflow-hidden rounded-card border border-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
