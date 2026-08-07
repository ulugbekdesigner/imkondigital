/**
 * Ro'yxat sahifalari (suhbat mashqi tarixi, mentorliklar) uchun umumiy
 * "yuklanmoqda" ko'rinishi — route level `loading.tsx` fayllarida ishlatiladi.
 */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul role="status" aria-label="Yuklanmoqda…" className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-touch items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3"
        >
          <span className="imk-skeleton shrink-0 rounded-full" style={{ width: 36, height: 36 }} />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="imk-skeleton" style={{ width: '55%' }} />
            <span className="imk-skeleton" style={{ width: '30%', height: 10 }} />
          </span>
          <span className="imk-skeleton shrink-0 rounded-full" style={{ width: 72, height: 26 }} />
        </li>
      ))}
    </ul>
  );
}
