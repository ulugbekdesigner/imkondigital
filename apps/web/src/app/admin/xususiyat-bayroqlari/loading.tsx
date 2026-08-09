import { Skeleton } from '@imkon/ui';

/** /admin/xususiyat-bayroqlari yuklanayotganda - bayroqlar ro'yxati skeleti. */
export default function AdminFeatureFlagsLoading() {
  return (
    <div className="max-w-4xl">
      <span className="sr-only" role="status">
        Xususiyat bayroqlari yuklanmoqda...
      </span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="mt-5 flex flex-col gap-0 overflow-hidden rounded-card border border-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-line p-4 first:border-t-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
