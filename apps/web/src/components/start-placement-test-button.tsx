'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

const LANGUAGES: { key: 'en' | 'ru'; label: string }[] = [
  { key: 'en', label: 'Ingliz tili' },
  { key: 'ru', label: 'Rus tili' },
];

export function StartPlacementTestButton() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/placement-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik test limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'Boshlashda xatolik yuz berdi.'),
        );
        return;
      }
      router.push(`/daraja-testi/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="placement-test-language" className="sr-only">
          Qaysi tildan test topshirasiz
        </label>
        <select
          id="placement-test-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'ru')}
          className="min-h-touch rounded-full border border-line bg-paper px-4 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {LANGUAGES.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
        <Button disabled={loading} onClick={start}>
          {loading ? 'Boshlanmoqda…' : 'Testni boshlash'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
    </div>
  );
}
