import { Skeleton, StatCardSkeleton } from '@imkon/ui';

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

        <div className="mt-5">
          <StatCardSkeleton count={8} />
        </div>

        <div className="mt-6">
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
