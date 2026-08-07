'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Radio } from '@imkon/ui';

const CATEGORIES = [
  { value: 'moliyaviy', label: 'Moliyaviy' },
  { value: 'soliq', label: 'Soliq' },
  { value: 'transport', label: 'Transport' },
  { value: 'talim', label: "Ta'lim" },
  { value: 'bandlik', label: 'Bandlik' },
  { value: 'tibbiy', label: 'Tibbiy' },
  { value: 'boshqa', label: 'Boshqa' },
];

export function CreateBenefitForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]!.value);
  const [providerType, setProviderType] = useState<'davlat' | 'kompaniya'>('davlat');
  const [audience, setAudience] = useState<'user' | 'employer'>('user');
  const [howToApply, setHowToApply] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          provider_type: providerType,
          audience,
          how_to_apply: howToApply,
          external_url: externalUrl || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!createRes.ok) {
        setError('Imtiyoz yaratishda xatolik yuz berdi.');
        return;
      }
      const benefit = (await createRes.json()) as { id: number };
      const publishRes = await fetch(`/api/benefits/${benefit.id}/publish`, { method: 'POST' });
      if (!publishRes.ok) {
        setError('Imtiyoz yaratildi, lekin chop etishda xatolik yuz berdi.');
        return;
      }
      router.push(`/imtiyozlar/${benefit.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[20px] border border-line bg-paper p-6 shadow-glass"
    >
      <Input label="Sarlavha" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-base font-medium text-ink">Kategoriya</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-sans text-base font-medium text-ink">Kim taqdim etadi</legend>
        <div className="flex flex-wrap gap-4">
          <Radio
            name="provider_type"
            label="Davlat"
            checked={providerType === 'davlat'}
            onChange={() => setProviderType('davlat')}
          />
          <Radio
            name="provider_type"
            label="Kompaniya"
            checked={providerType === 'kompaniya'}
            onChange={() => setProviderType('kompaniya')}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-sans text-base font-medium text-ink">Kimga tegishli</legend>
        <div className="flex flex-wrap gap-4">
          <Radio
            name="audience"
            label="Nogironligi bor insonlarga"
            checked={audience === 'user'}
            onChange={() => setAudience('user')}
          />
          <Radio
            name="audience"
            label="Ish beruvchilarga"
            checked={audience === 'employer'}
            onChange={() => setAudience('employer')}
          />
        </div>
      </fieldset>

      <Input
        label="Qanday murojaat qilish kerak"
        value={howToApply}
        onChange={(e) => setHowToApply(e.target.value)}
        hint="Masalan: Fuqarolar yig'inida yoki soliq idorasida ariza bering"
      />
      <Input
        label="Havola (ixtiyoriy)"
        type="url"
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
      />
      <Input
        label="Amal qilish muddati (ixtiyoriy)"
        type="date"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        hint="Bo'sh qoldirsangiz, muddatsiz imtiyoz sifatida ko'rsatiladi"
      />

      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Joylanmoqda…' : 'Imtiyozni chop etish'}
      </Button>
    </form>
  );
}
