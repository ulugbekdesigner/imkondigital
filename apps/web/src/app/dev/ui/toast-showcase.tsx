'use client';
import { useToast, type ToastVariant } from '@/components/toast';

const DEMO: { variant: ToastVariant; label: string; title: string; body?: string }[] = [
  {
    variant: 'success',
    label: 'Muvaffaqiyat',
    title: 'Ariza yuborildi',
    body: 'Uzum · Junior Frontend',
  },
  { variant: 'message', label: 'Xabar', title: '3 ta yangi xabar' },
  {
    variant: 'opportunity',
    label: 'Imkoniyat',
    title: 'Yangi imkoniyat',
    body: 'Sizga mos 2 vakansiya',
  },
  {
    variant: 'system',
    label: 'Tizim',
    title: 'Sayt yangilandi',
    body: "Yangi bo'lim: Xalqaro ishlar",
  },
  {
    variant: 'error',
    label: 'Xato',
    title: 'Yuklab bo\'lmadi',
    body: 'Fayl juda katta',
  },
];

/** /dev/ui uchun — 5 toast variantini alohida ko'rish (5b-blok, 1-bo'lim). */
export function ToastShowcase() {
  const showToast = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      {DEMO.map((d) => (
        <button
          key={d.variant}
          type="button"
          onClick={() => showToast({ variant: d.variant, title: d.title, body: d.body })}
          className="min-h-touch border-line bg-paper text-ink hover:bg-mint focus-visible:ring-focus rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
