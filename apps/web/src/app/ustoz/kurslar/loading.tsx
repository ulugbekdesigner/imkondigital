import { Skeleton } from '@imkon/ui';

/**
 * Ustoz kabineti ichidagi (dashboard/kurslar/topshiriqlar/o'quvchilar/
 * sharhlar/sozlamalar/jonli darslar/baholash/kurs konstruktori) har bir
 * sahifa uchun umumiy yuklanmoqda holati — CabinetShell (sidebar+topbar)
 * layout.tsx orqali darhol chizilib bo'ladi, faqat shu {children} maydoni
 * skelet bilan almashadi. Aniq sahifa shaklidan qat'i nazar barchasi
 * "sarlavha + qator ro'yxati" ko'rinishida bo'lgani uchun bitta umumiy
 * skelet real tarkib joylashuviga yetarlicha yaqin.
 */
export default function UstozKurslarLoading() {
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
          {Array.from({ length: 4 }).map((_, i) => (
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
