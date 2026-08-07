import { Skeleton } from '@imkon/ui';

/** Trayektoriya yuklanish holati — docs/design/README.md majburiy holat qoidasi
 * (har ekran: yuklanmoqda/bo'sh/xato/qulflangan). Sarlavha + progress +
 * keyingi qadam + narvon shakliga mos shimmer-bloklar. */
export default function TrayektoriyaLoading() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10">
      <span className="sr-only" role="status">
        Trayektoriya yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-5 w-full max-w-md" />

        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>

        <Skeleton className="h-[76px] w-full rounded-2xl" />

        <div className="flex flex-col gap-4 rounded-2xl border border-line p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
