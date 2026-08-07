'use client';
import { useState } from 'react';
import { CelebrationScreen, type CelebrationVariant } from '@/components/celebration-screen';

const DEMO: { variant: CelebrationVariant; label: string; title: string; message: string }[] = [
  {
    variant: 'oquvchi',
    label: "O'quvchi",
    title: 'Kursni tugatdingiz!',
    message: '"Data entry asoslari" sertifikati tayyor.',
  },
  {
    variant: 'ustoz',
    label: 'Ustoz',
    title: "O'quvchingiz ishga joylashdi",
    message: 'Sardor Talaba endi Alfa Telekom jamoasida.',
  },
  {
    variant: 'ish-beruvchi',
    label: 'Ish beruvchi',
    title: 'Yangi xodim jamoada',
    message: 'Nomzod arizani qabul qildi — ishga chiqish sanasi kelishildi.',
  },
  {
    variant: 'donor',
    label: 'Donor',
    title: 'Maqsadga yetildi',
    message: '"10 ta noutbuk granti" loyihasi 100% yigʻildi.',
  },
];

/** /dev/ui uchun — 4 rol tabrik ekranini alohida ko'rish (5b-blok). 3 tasi
 * haqiqiy voqeadan ishga tushiriladi: "o'quvchi" — kurs tugatish
 * (course-player.tsx), "ish beruvchi" — arizani qabul qilish
 * (applicants-manager.tsx), "donor" — loyiha "funded" holatiga o'tishi
 * (donation-funded-celebration.tsx). "Ustoz" (N-o'quvchi ishga joylashdi)
 * hali ulanmagan — buning uchun "qaysi ustozga hisoblanadi" atributsiya
 * mantig'i va yangi bildirishnoma turi kerak, bu alohida mahsulot qarori
 * (soxta/o'ylab topilgan hisoblash kiritilmadi). */
export function CelebrationShowcase() {
  const [active, setActive] = useState<CelebrationVariant | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      {DEMO.map((d) => (
        <button
          key={d.variant}
          type="button"
          onClick={() => setActive(d.variant)}
          className="min-h-touch border-line bg-paper text-ink hover:bg-mint focus-visible:ring-focus rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {d.label}
        </button>
      ))}
      {DEMO.map(
        (d) =>
          active === d.variant && (
            <CelebrationScreen
              key={d.variant}
              variant={d.variant}
              title={d.title}
              message={d.message}
              onDismiss={() => setActive(null)}
            />
          ),
      )}
    </div>
  );
}
