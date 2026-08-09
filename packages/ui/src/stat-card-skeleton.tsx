import { Skeleton } from './skeleton';

export interface StatCardSkeletonProps {
  count?: number;
}

/* QA_AUDIT D6: admin statistika kartalari uchun umumiy skelet - avval har
   loading.tsx faylida qayta yozilgan edi (kompaniyalar/foydalanuvchilar,
   AI-foydalanish, boshqaruv paneli). Bitta joyda - hammasi bir xil ko'rinadi. */
export function StatCardSkeleton({ count = 8 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-line bg-paper p-[18px]">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
