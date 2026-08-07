'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { buttonVariants, cn, GirihDivider, glassCardVariants } from '@imkon/ui';
import { NARVON } from '@/lib/narvon';
import type { SuccessStoryOut } from '@/lib/success-stories-api';
import { RevealGroup, RevealItem } from './reveal';

const STEP_BG = ['bg-step-0', 'bg-step-1', 'bg-step-2', 'bg-step-3', 'bg-step-4'];

export function NarvonHero({ stories }: { stories: SuccessStoryOut[] }) {
  const [active, setActive] = useState(1); // 0-indeks; boshida "yordamchi kasblar"
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
    <section className="relative overflow-hidden bg-deep">
      {/* Gradient-mesh foni — sof dekorativ, sekin "suzadi" (V2 A5, foydalanuvchi so'rovi: shisha/premium tuyg'u) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-bright/25 blur-3xl motion-reduce:animate-none" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] animate-float rounded-full bg-gold/20 blur-3xl motion-reduce:animate-none [animation-delay:-9s]" />
      </div>
      <RevealGroup className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        {/* Chap: matn + narvon tab'lari */}
        <RevealItem>
          <p className="font-mono text-xs uppercase tracking-widest text-bright">
            Inklyuziv raqamli karyera platformasi
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-deep-fg md:text-hero">
            Raqamli kasb — chegarasiz imkoniyat
          </h1>
          <p className="mt-4 max-w-md font-sans text-md text-mist">
            Uydan turib kasb o‘rganing, portfolio yig‘ing, ish toping va daromad qiling.
            Har qadamda AI yordamchi va real mentor yoningizda.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/royxatdan-otish" className={buttonVariants({ size: 'lg' })}>
              Bepul boshlash
            </Link>
            <Link
              href="/kurslar"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-mist text-mist hover:bg-deep-fg/10',
              )}
            >
              Kurslarni ko‘rish
            </Link>
          </div>
        </RevealItem>

        {/* O'ng: interaktiv Narvon */}
        <RevealItem className={cn(glassCardVariants({ surface: 'on-dark' }), 'p-4 sm:p-6')}>
          <h2 className="mb-1 font-display text-base font-semibold text-deep-fg">Raqamli Narvon</h2>
          <p className="mb-4 font-sans text-xs text-mist">
            Pog‘onani tanlab, qanday kasblar va daromad kutayotganini ko‘ring.
          </p>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            {/* Tab'lar (vertikal) */}
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Raqamli Narvon pog‘onalari"
              className="flex gap-2 overflow-x-auto [contain:layout] sm:flex-col sm:overflow-visible sm:[contain:none]"
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
                    id={`narvon-tab-${r.step}`}
                    aria-selected={selected}
                    aria-controls="narvon-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={onKeyDown}
                    className={cn(
                      'flex min-h-touch items-center gap-2 rounded-lg px-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep',
                      'motion-reduce:transition-none',
                      selected ? 'bg-deep-fg text-deep' : 'text-mist hover:bg-deep-fg/10',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded font-mono text-base font-bold text-deep',
                        STEP_BG[r.step],
                      )}
                      aria-hidden="true"
                    >
                      {r.step}
                    </span>
                    <span className="font-sans text-base font-medium">{r.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div
              role="tabpanel"
              id="narvon-panel"
              aria-labelledby={`narvon-tab-${rung.step}`}
              className="rounded-lg bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-md font-semibold text-ink">{rung.title}</h3>
                <span className="rounded-sm bg-mint px-2 py-0.5 font-mono text-xs font-semibold text-ink">
                  {rung.duration}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {rung.professions.map((p) => (
                  <li key={p} className="flex items-start gap-2 font-sans text-base text-ink">
                    <span aria-hidden="true" className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', STEP_BG[rung.step])} />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 font-sans text-base font-medium text-primary">
                {rung.income}
              </p>

              {story && (
                <div className="mt-4 rounded-lg border-l-4 border-gold bg-mint p-3 shadow-glow-gold">
                  <p className="font-sans text-sm italic text-ink">“{story.quote}”</p>
                  <p className="mt-2 font-mono text-xs font-semibold text-ink">
                    {story.full_name} · {story.profession}
                  </p>
                </div>
              )}
            </div>
          </div>
        </RevealItem>
      </RevealGroup>
      <GirihDivider className="text-deep-fg" />
    </section>
  );
}
