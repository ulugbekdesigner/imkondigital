'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, GlassCard, Skeleton } from '@imkon/ui';
import { AlertIcon, RefreshIcon, SearchIcon } from '@/components/shell-icons';
import { EmptyState } from '@/components/state-panels';
import type { SearchResults } from '@/lib/types';

// Backend har toifani 6 tagacha cheklaydi (app/modules/search/service.py::_LIMIT) —
// aynan shu songa yetilsa "+" bilan ko'rsatiladi, chunki undan ko'p bo'lishi mumkin.
const SEARCH_LIMIT = 6;

function askZiyo(query: string) {
  window.dispatchEvent(new CustomEvent('imkon:ask-ziyo', { detail: { query } }));
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Alohida funksiyaga chiqarilgan — "Qayta urinish" tugmasi ham xuddi shu
  // so'rovni debounce'siz qayta yuborishi kerak (xato holatidan chiqish).
  const runSearch = useCallback((q: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? (res.json() as Promise<SearchResults>) : Promise.reject()))
      .then((data) => setResults(data))
      .catch(() => {
        setResults(null);
        setError('Qidiruvda xatolik yuz berdi.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    const timer = setTimeout(() => runSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const total = results
    ? results.courses.length +
      results.vacancies.length +
      results.benefits.length +
      results.materials.length
    : 0;
  const showEmptyState = results !== null && !loading && total === 0;

  return (
    <div>
      <label htmlFor="global-search-input" className="sr-only">
        Kurs, vakansiya, material yoki imtiyoz qidirish
      </label>
      <input
        ref={inputRef}
        id="global-search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Kurs, vakansiya, material yoki imtiyoz qidiring…"
        className="min-h-touch w-full rounded-full border border-line bg-paper px-5 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      />

      <div className="mt-8" aria-live="polite">
        {loading && (
          <div className="flex flex-col gap-3">
            <span className="sr-only">Qidirilmoqda…</span>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          // Bu yerdagi xato client-side fetch natijasi — server komponent
          // emas, shu sabab umumiy RetryButton (router.refresh()) mos emas;
          // xuddi shu so'rovni runSearch bilan qayta yuboradi.
          <div className="imk-error" role="alert">
            <span aria-hidden="true" className="imk-error__icon">
              <AlertIcon width={22} height={22} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">{error}</h2>
              <p className="mt-1 max-w-xl font-sans text-base text-ink-soft">
                Internet aloqasi yoki server bilan muammo bo'lishi mumkin.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => runSearch(query.trim())}
              className="border border-line px-4 text-ink"
            >
              <RefreshIcon width={16} height={16} />
              Qayta urinish
            </Button>
          </div>
        )}

        {showEmptyState && (
          <EmptyState
            icon={<SearchIcon width={22} height={22} />}
            title={`"${query.trim()}" bo'yicha hech narsa topilmadi`}
            description="Boshqacha so'z bilan urinib ko'ring yoki Ziyo'dan so'rang — u sizga yordam beradi."
            action={
              <Button size="md" className="mt-1" onClick={() => askZiyo(query.trim())}>
                Ziyo'dan so'rash
              </Button>
            }
          />
        )}

        {results && !loading && total > 0 && (
          <div className="flex flex-col gap-8">
            {results.courses.length > 0 && (
              <ResultSection title="Kurslar" count={results.courses.length}>
                {results.courses.map((c) => (
                  <ResultCard key={`course-${c.id}`} href={`/kurslar/${c.slug}`}>
                    <span className="font-sans text-base text-ink">{c.title}</span>
                    <span className="flex items-center gap-2">
                      {c.is_free && <Badge variant="primary">Bepul</Badge>}
                      <span className="font-sans text-sm text-ink-soft">{c.ladder_step}-pog'ona</span>
                    </span>
                  </ResultCard>
                ))}
              </ResultSection>
            )}

            {results.vacancies.length > 0 && (
              <ResultSection title="Vakansiyalar" count={results.vacancies.length}>
                {results.vacancies.map((v) => (
                  <ResultCard key={`vacancy-${v.id}`} href={`/vakansiyalar/${v.id}`}>
                    <span className="font-sans text-base text-ink">{v.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-sans text-sm text-ink-soft">{v.company_name}</span>
                      {v.match_score !== null && (
                        <span className="font-sans text-sm font-bold text-primary">
                          {v.match_score}%
                        </span>
                      )}
                    </span>
                  </ResultCard>
                ))}
              </ResultSection>
            )}

            {results.benefits.length > 0 && (
              <ResultSection title="Imtiyozlar" count={results.benefits.length}>
                {results.benefits.map((b) => (
                  <ResultCard key={`benefit-${b.id}`} href={`/imtiyozlar/${b.id}`}>
                    <span className="font-sans text-base text-ink">{b.title}</span>
                  </ResultCard>
                ))}
              </ResultSection>
            )}

            {results.materials.length > 0 && (
              <ResultSection title="Materiallar" count={results.materials.length}>
                {results.materials.map((m) => (
                  <ResultCard key={`material-${m.id}`} href={`/kurslar/${m.course_slug}`}>
                    <span className="font-sans text-base text-ink">{m.title}</span>
                    <span className="font-sans text-sm text-ink-soft">{m.course_title}</span>
                  </ResultCard>
                ))}
              </ResultSection>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-mint/30 px-5 py-4">
              <span className="font-sans text-sm text-ink-soft">Kerakli narsani topmadingizmi?</span>
              <Button size="md" className="text-sm" onClick={() => askZiyo(query.trim())}>
                Ziyo'dan so'rash
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-base font-semibold text-ink">
        {title} · {count}
        {count === SEARCH_LIMIT && '+'}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function ResultCard({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="block min-h-touch rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <GlassCard hover className="flex flex-wrap items-center justify-between gap-2 p-4">
          {children}
        </GlassCard>
      </Link>
    </li>
  );
}
