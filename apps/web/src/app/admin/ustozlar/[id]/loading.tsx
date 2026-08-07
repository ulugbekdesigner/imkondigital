import { Skeleton } from '@imkon/ui';

/** /admin/ustozlar/[id] yuklanayotganda — orqaga havola, avatar+sarlavha
 * va kurslar ro'yxati bo'yicha skelet. */
export default function AdminInstructorDetailLoading() {
  return (
    <div className="max-w-3xl">
      <span className="sr-only" role="status">
        Ustoz tafsiloti yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <Skeleton className="h-4 w-32" />

        <div className="mt-3 flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[14px] border border-line bg-paper px-4 py-3.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2.5 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
