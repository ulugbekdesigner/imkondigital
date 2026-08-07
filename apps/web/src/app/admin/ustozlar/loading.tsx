import { Skeleton } from '@imkon/ui';

/** /admin/ustozlar yuklanayotganda — sarlavha, qidiruv paneli va jadval
 * qatorlari bo'yicha skelet. */
export default function AdminInstructorsLoading() {
  return (
    <div className="max-w-5xl">
      <span className="sr-only" role="status">
        Ustozlar ro&apos;yxati yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <Skeleton className="mt-4 h-11 max-w-md rounded-full" />

        <div className="mt-5 flex flex-col gap-0 overflow-hidden rounded-[18px] border border-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
              <Skeleton className="hidden h-4 w-32 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
