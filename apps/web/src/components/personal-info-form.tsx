'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import type { Me, Region } from '@/lib/types';

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: 'Erkak' },
  { value: 'female', label: 'Ayol' },
];

function initialState(me: Me) {
  return {
    fullName: me.full_name,
    email: me.email ?? '',
    birthDate: me.birth_date ?? '',
    gender: me.gender ?? '',
    regionId: me.region_id !== null ? String(me.region_id) : '',
  };
}

export function PersonalInfoForm({ me, regions }: { me: Me; regions: Region[] }) {
  const router = useRouter();
  const [form, setForm] = useState(initialState(me));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ReturnType<typeof initialState>>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleReset() {
    setForm(initialState(me));
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.fullName,
          email: form.email || null,
          birth_date: form.birthDate || null,
          gender: form.gender || null,
          region_id: form.regionId ? Number(form.regionId) : null,
        }),
      });
      if (!res.ok) {
        setError('Saqlashda xatolik yuz berdi.');
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="shaxsiy-malumotlar" onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <Input
          label="Ism familiya"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          minLength={2}
          maxLength={160}
          required
        />
        <Input label="Telefon" value={me.phone} disabled />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="region-select" className="font-sans text-base font-medium text-ink">
            Hudud (ixtiyoriy)
          </label>
          <select
            id="region-select"
            value={form.regionId}
            onChange={(e) => update('regionId', e.target.value)}
            className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <option value="">Tanlanmagan</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Tug'ilgan sana (ixtiyoriy)"
          type="date"
          value={form.birthDate}
          onChange={(e) => update('birthDate', e.target.value)}
        />
        <Input
          label="Email (ixtiyoriy)"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gender-select" className="font-sans text-base font-medium text-ink">
            Jins (ixtiyoriy)
          </label>
          <select
            id="gender-select"
            value={form.gender}
            onChange={(e) => update('gender', e.target.value)}
            className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <option value="">Tanlanmagan</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-1 font-sans text-sm text-primary">
          <CheckIcon width={14} height={14} />
          Saqlandi
        </p>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
          Bekor
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saqlanmoqda…' : 'Saqlash'}
        </Button>
      </div>
    </form>
  );
}
