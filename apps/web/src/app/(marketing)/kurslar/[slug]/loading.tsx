import { Skeleton } from '@imkon/ui';

/** /kurslar/[slug] yuklanish holati — docs/design/README.md majburiy holat qoidasi.
 * Quyuq sarlavha zonasi + pleer + yon panel (Darslar/Ziyo/Topshiriq/
 * Sertifikat) shaklini takrorlaydi, shu sabab birdan "sakrash" bo'lmaydi. */
export default function CourseDetailLoading() {
  return (
    <>
      <span className="sr-only" role="status">
        Kurs sahifasi yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="bg-deep">
          <div className="mx-auto max-w-6xl px-4 pt-8">
            <Skeleton className="h-4 w-40 bg-deep-fg/10" />
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-deep-fg/10" />
              <Skeleton className="h-6 w-20 rounded-full bg-deep-fg/10" />
            </div>
            <Skeleton className="mt-3 h-8 w-2/3 bg-deep-fg/10" />
            <Skeleton className="mt-2 h-4 w-1/2 bg-deep-fg/10" />
            <Skeleton className="mt-3 h-4 w-1/3 bg-deep-fg/10" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div>
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="mt-4 h-6 w-2/5" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 flex-1 rounded-full" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
