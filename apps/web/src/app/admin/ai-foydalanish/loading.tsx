import { Skeleton } from '@imkon/ui';

/** /admin/ai-foydalanish yuklanayotganda — statistika kartalari va grafik skeleti. */
export default function AdminAiUsageLoading() {
  return (
    <div className="max-w-4xl">
      <span className="sr-only" role="status">
        AI foydalanish statistikasi yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 rounded-card border border-line p-[18px]">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
