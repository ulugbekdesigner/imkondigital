'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import { GIG_CATEGORIES } from '@/lib/gig-categories';

export function CreateGigForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          price_from: Number(priceFrom),
          delivery_days: Number(deliveryDays),
        }),
      });
      if (!createRes.ok) {
        setError("Xizmat yaratishda xatolik yuz berdi.");
        return;
      }
      const gig = (await createRes.json()) as { id: number };
      const publishRes = await fetch(`/api/gigs/${gig.id}/publish`, { method: 'POST' });
      if (!publishRes.ok) {
        setError('Xizmat yaratildi, lekin chop etishda xatolik yuz berdi.');
        return;
      }
      router.push(`/gigs/${gig.id}`);
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
      <Input label="Xizmat nomi" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gig-category" className="font-sans text-base font-medium text-ink">
          Kategoriya
        </label>
        <select
          id="gig-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <option value="" disabled>
            Tanlang
          </option>
          {GIG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Narx (so'mdan boshlab)"
        type="number"
        min={0}
        value={priceFrom}
        onChange={(e) => setPriceFrom(e.target.value)}
        required
      />
      <Input
        label="Bajarish muddati (kun)"
        type="number"
        min={1}
        max={90}
        value={deliveryDays}
        onChange={(e) => setDeliveryDays(e.target.value)}
        required
      />
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={loading} className="self-start">
        {loading ? 'Joylanmoqda…' : "Xizmatni chop etish"}
      </Button>
    </form>
  );
}
