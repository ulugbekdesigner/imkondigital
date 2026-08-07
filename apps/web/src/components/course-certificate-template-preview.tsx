import { ShieldIcon } from '@/components/shell-icons';

/**
 * "Sertifikat shabloni" — kurs konstruktori (docs/design/README.md 2-bo'lim,
 * bloklar 4h/4s/4w). Sertifikat PDF'i har doim IMKON Digital tomonidan
 * bitta umumiy shablon bo'yicha avtomatik yaratiladi (ustoz uni
 * tahrirlay olmaydi — backend'da bunday sozlama yo'q), shu sababli bu
 * yerda HAQIQIY tahrirlovchi emas, balki ustozga kursi tugatilganda
 * o'quvchi qanday sertifikat olishini oldindan ko'rsatadigan NAMUNA
 * (soxta "shablon tahrirlash" tugmasi qo'yilmadi — CONTRIBUTING.md qoida 2:
 * ishlamaydigan funksiya ko'rsatilmaydi).
 */
export function CourseCertificateTemplatePreview({ courseTitle }: { courseTitle: string }) {
  return (
    <section className="mt-10 flex flex-col gap-4 rounded-[18px] border border-line bg-paper p-6">
      <div className="flex items-center gap-2">
        <ShieldIcon width={20} height={20} className="text-primary" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">Sertifikat shabloni</h2>
      </div>
      <p className="font-sans text-sm text-ink-soft">
        Kursni tugatgan o&apos;quvchi avtomatik ravishda quyidagi ko&apos;rinishdagi sertifikatni
        oladi. Shablon barcha kurslar uchun umumiy va IMKON Digital tomonidan boshqariladi —
        faqat kurs nomi va bitiruvchi ismi o&apos;zgaradi.
      </p>

      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-2xl border p-6 text-center sm:p-8"
        style={{
          borderColor: 'rgb(var(--imkon-gold))',
          background:
            'linear-gradient(160deg, color-mix(in srgb, rgb(var(--imkon-gold)) 10%, var(--c-surface)), var(--c-surface))',
        }}
      >
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'rgb(var(--imkon-gold))', color: 'var(--imkon-gold-fg)' }}
        >
          <ShieldIcon width={24} height={24} />
        </span>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          IMKON Digital — Muvaffaqiyatli tamomlash sertifikati
        </p>
        <p className="mt-3 font-display text-lg font-bold text-ink" title="Bitiruvchi ismi (namuna)">
          Bitiruvchi ismi
        </p>
        <p className="mt-1 font-sans text-sm text-ink-soft">quyidagi kursni muvaffaqiyatli tamomladi:</p>
        <p className="mt-2 font-display text-base font-semibold text-ink">{courseTitle}</p>
        <p className="mt-4 font-mono text-[11px] text-ink-soft">
          ID: IMKON-XXXXXXXX · tekshirish: imkondigital.uz/verify/…
        </p>
      </div>
    </section>
  );
}
