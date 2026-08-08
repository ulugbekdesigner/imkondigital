'use client';

import { SendIcon } from '@/components/shell-icons';
import { ZiyoMascot } from './ziyo-mascot';

const TOPICS = [
  { query: 'Menga qanday kurs mos keladi?', label: 'Kurs tanlash' },
  { query: 'Menga mos vakansiyalarni ko‘rsating', label: 'Ish topish' },
  { query: 'Rezyume tuzishda yordam bering', label: 'Rezyume' },
];

function ask(query: string) {
  window.dispatchEvent(new CustomEvent('imkon:ask-ziyo', { detail: { query } }));
}

/**
 * Bu SOXTA suhbat emas — real global ZiyoWidget'ni (haqiqiy Gemini
 * chaqiruvi bilan) ochadigan kirish nuqtasi. GlobalSearch'dagi
 * "Ziyo'dan so'rash" bilan bir xil `imkon:ask-ziyo` hodisasidan foydalanadi.
 */
export function ZiyoPreviewChat() {
  return (
    <div className="imk-glass p-6">
      <div
        className="flex items-center gap-3.5 border-b pb-4"
        style={{ borderColor: 'var(--land-line-dark)' }}
      >
        <ZiyoMascot size={52} />
        <div className="flex flex-col">
          <span className="text-base font-bold text-white">ZIYO yordamchisi</span>
          <span className="text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
            Yo&apos;lda yolg&apos;iz qolmaysiz · 24/7
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <div
          className="max-w-[88%] self-start rounded-card rounded-bl-md px-4 py-3.5 text-[15px] leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--land-text-on-dark)' }}
        >
          Salom! Men ZIYO. Kurs, ish yoki rezyume haqida — nimadan boshlaymiz?
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="ZIYO'ga tezkor savol">
        {TOPICS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => ask(t.query)}
            className="imk-chip inline-flex min-h-touch items-center"
            style={{ cursor: 'pointer' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => ask('')}
        className="mt-4 flex w-full items-center gap-2 rounded-full px-3.5 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--land-text-on-dark-dim)' }}
      >
        Savolingizni yozing yoki ayting…
        <span
          aria-hidden="true"
          className="ml-auto flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }}
        >
          <SendIcon width={12} height={12} />
        </span>
      </button>
    </div>
  );
}
