import { Skeleton } from '@imkon/ui';

/** /admin/foydalanuvchilar yuklanayotganda — sarlavha+CSV tugmasi, rol
 * filtrlari, qidiruv paneli va jadval qatorlari bo'yicha skelet. */
export default function AdminUsersLoading() {
  return (
    <div className="max-w-5xl">
      <span className="sr-only" role="status">
        Foydalanuvchilar ro&apos;yxati yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        <Skeleton className="mt-4 h-11 max-w-md rounded-full" />

        <div className="mt-5 flex flex-col gap-0 overflow-hidden rounded-card border border-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
