'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import type { Region } from '@/lib/types';

export function CreateCourseForm({ regions }: { regions: Region[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ladderStep, setLadderStep] = useState('1');
  const [regionId, setRegionId] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          ladder_step: Number(ladderStep),
          region_id: regionId ? Number(regionId) : null,
          duration_weeks: durationWeeks ? Number(durationWeeks) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('Kurs yaratishda xatolik yuz berdi.');
        return;
      }
      router.push(`/ustoz/kurslar/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-5"
    >
      <Input label="Kurs nomi" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Narvon pog'onasi (0-4)"
        type="number"
        min={0}
        max={4}
        value={ladderStep}
        onChange={(e) => setLadderStep(e.target.value)}
        required
      />
      <Input
        label="Davomiyligi (hafta, ixtiyoriy)"
        type="number"
        min={1}
        max={104}
        value={durationWeeks}
        onChange={(e) => setDurationWeeks(e.target.value)}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="create-course-region" className="font-sans text-sm font-medium text-ink-soft">
          Hudud (ixtiyoriy)
        </label>
        <select
          id="create-course-region"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <option value="">Onlayn / hududga bog'liq emas</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Yaratilmoqda…' : 'Yaratish'}
      </Button>
    </form>
  );
}
