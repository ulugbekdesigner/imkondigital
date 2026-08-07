import { Skeleton } from '@imkon/ui';

/** /profil yuklanish holati — docs/design/README.md majburiy holat qoidasi
 * (har ekran: yuklanmoqda/bo'sh/xato/qulflangan). Profil sahifasi
 * (avatar+ism karta, to'liqlik, portfolio, tab paneli) shakliga mos
 * shimmer-bloklar — hech qachon bo'sh oq ekran ko'rsatilmasin. */
export default function ProfilLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <span className="sr-only" role="status">
        Profil yuklanmoqda…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="rounded-[20px] border border-line bg-paper p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-[88px] w-[88px] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-full" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-[132px] w-full rounded-[20px]" />

        <Skeleton className="h-[170px] w-full rounded-[20px]" />

        <div className="flex gap-3 border-t border-line pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-full max-w-md rounded-full" />
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
