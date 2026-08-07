/**
 * AI suhbat panellari (karyera maslahatchisi, CV, suhbat mashqi, mentorlik,
 * case-hikoya) uchun umumiy "yuklanmoqda" ko'rinishi — route level `loading.tsx`
 * fayllarida ishlatiladi (docs/design/README.md: har ro'yxat/panelda yuklanmoqda holati
 * MAJBURIY). Sof `.imk-skeleton` (parts.css) primitividan yig'ilgan.
 */
export function AiPanelSkeleton() {
  return (
    <div
      role="status"
      aria-label="Yuklanmoqda…"
      className="flex flex-col gap-3 rounded-[20px] border border-line bg-paper p-4"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <span className="imk-skeleton" style={{ width: '40%' }} />
      </div>
      <div className="flex min-h-[16rem] flex-col gap-3 py-1">
        <span className="imk-skeleton ml-auto" style={{ width: '55%', height: 36 }} />
        <span className="imk-skeleton mr-auto" style={{ width: '72%', height: 52 }} />
        <span className="imk-skeleton ml-auto" style={{ width: '38%', height: 36 }} />
        <span className="imk-skeleton mr-auto" style={{ width: '60%', height: 36 }} />
      </div>
      <span className="imk-skeleton" style={{ width: '100%', height: 44, borderRadius: 999 }} />
    </div>
  );
}
