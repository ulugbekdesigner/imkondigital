import { Skeleton } from '@imkon/ui';

/**
 * QA_AUDIT D10: kabinet ichidagi (ustoz/kurslar/*, donor, ustoz profili va
 * h.k.) sahifalar orasida o'tishda oq ekran ko'rinmasligi uchun umumiy
 * "sarlavha + qator ro'yxati" skeleti. CabinetShell (sidebar+topbar)
 * layout.tsx orqali darhol chizilib bo'ladi, faqat {children} maydoni shu
 * skelet bilan almashadi - Next.js'da loading.tsx faqat BIR XIL papkadagi
 * page.tsx uchun ishlaydi, shu sabab har bir ichki route'ga bittadan kerak.
 */
export function CabinetContentSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="max-w-3xl">
      <span className="sr-only" role="status">
        Sahifa yuklanmoqda…
      </span>
      <div aria-hidden="true">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-touch items-center justify-between gap-3 rounded border border-line px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
