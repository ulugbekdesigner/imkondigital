import { Skeleton } from '@imkon/ui';

/** /admin/audit-jurnali yuklanayotganda — sarlavha+CSV tugmasi, maxfiylik
 * izohi qatori va jadval qatorlari bo'yicha skelet. */
export default function AdminAuditLogLoading() {
  return (
    <div className="max-w-4xl">
      <span className="sr-only" role="status">
        Audit jurnali yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>

        <Skeleton className="mb-4 mt-4 h-3.5 w-72" />

        <div className="flex flex-col gap-0 overflow-hidden rounded-card border border-line">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
            >
              <Skeleton className="h-3 w-24 shrink-0" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
