import { Skeleton } from '@imkon/ui';

/** Bildirishnomalar yuklanish holati — docs/design/README.md majburiy holat qoidasi
 * (har ekran: yuklanmoqda/bo'sh/xato/qulflangan). Sarlavha + 3 tab + ro'yxat
 * shakliga mos shimmer-bloklar, hech qachon bo'sh oq ekran ko'rsatilmasin. */
export default function BildirishnomalarLoading() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10">
      <span className="sr-only" role="status">
        Bildirishnomalar yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-line pb-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
