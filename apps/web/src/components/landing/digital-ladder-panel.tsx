'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@imkon/ui';
import { NARVON } from '@/lib/narvon';
import type { SuccessStoryOut } from '@/lib/success-stories-api';

/**
 * Hero o'ng paneli — "Raqamli Narvon" interaktiv tab'lari, yangi
 * "Robot Aurora" oyna (glass) uslubida. Ma'lumot 100% real (lib/narvon.ts
 * taksonomiyasi); muvaffaqiyat iqtibosi FAQAT haqiqiy nashr qilingan
 * hikoya mavjud bo'lsa ko'rsatiladi (narvon-hero.tsx bilan bir xil tartib).
 */
export function DigitalLadderPanel({ stories }: { stories: SuccessStoryOut[] }) {
  const [active, setActive] = useState(1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = NARVON.length - 1;
    let next = active;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const rung = NARVON[active]!;
  const story = stories.find((s) => s.step === rung.step);

  return (
    <div className="imk-glass p-6">
      <h2 className="mb-1.5 text-xl font-extrabold tracking-tight text-white">Raqamli Narvon</h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
        Pog&apos;onani tanlang — qanday kasblar va daromad kutayotganini ko&apos;ring.
      </p>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Raqamli Narvon pog'onalari"
          className="flex flex-col gap-1.5"
        >
          {NARVON.map((r, i) => {
            const selected = i === active;
            return (
              <button
                key={r.step}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`land-narvon-tab-${r.step}`}
                aria-selected={selected}
                aria-controls="land-narvon-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
                className={cn('imk-ladder-tab', selected && 'imk-ladder-tab--active')}
              >
                <span aria-hidden="true" className="imk-ladder-step">
                  {r.step}
                </span>
                <span className="text-sm font-semibold">{r.title}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="land-narvon-panel"
          aria-labelledby={`land-narvon-tab-${rung.step}`}
          className="imk-ladder-panel"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="imk-ladder-panel-step">
              {rung.step}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 text-lg font-extrabold tracking-tight text-white">{rung.title}</h3>
                <span className="imk-ladder-duration">{rung.duration}</span>
              </div>
            </div>
          </div>
          <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0">
            {rung.professions.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-white">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: 'var(--land-teal-400)' }}
                />
                {p}
              </li>
            ))}
          </ul>
          <p
            className="mt-3.5 border-t pt-3 text-sm font-semibold"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'var(--land-teal-300)' }}
          >
            {rung.income}
          </p>
          {story && (
            <div className="imk-ladder-quote">
              <p className="m-0 text-[13px] italic text-white">&ldquo;{story.quote}&rdquo;</p>
              <p
                className="mt-2 font-mono text-xs font-semibold"
                style={{ color: 'var(--land-text-on-dark-dim)' }}
              >
                {story.full_name} · {story.profession}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
