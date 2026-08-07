'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function StartInterviewButton({
  vacancyOptions,
}: {
  vacancyOptions: { id: number; title: string }[];
}) {
  const router = useRouter();
  const [vacancyId, setVacancyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancy_id: vacancyId ? Number(vacancyId) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik mashq limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'Boshlashda xatolik yuz berdi.'),
        );
        return;
      }
      router.push(`/suhbat-mashqi/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {vacancyOptions.length > 0 && (
          <>
            <label htmlFor="interview-vacancy" className="sr-only">
              Qaysi vakansiyaga tayyorlanasiz
            </label>
            <select
              id="interview-vacancy"
              value={vacancyId}
              onChange={(e) => setVacancyId(e.target.value)}
              className="min-h-touch rounded-full border border-line bg-paper px-4 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <option value="">Umumiy mashq</option>
              {vacancyOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </>
        )}
        <Button disabled={loading} onClick={start}>
          {loading ? 'Tayyorlanmoqda…' : 'Yangi mashq boshlash'}
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
