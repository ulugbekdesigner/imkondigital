'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, buttonVariants, cn } from '@imkon/ui';

export function OrderForm({
  gigId,
  freelancerId,
  defaultTitle,
  defaultAmount,
  authed,
  isOwner,
}: {
  gigId: number;
  freelancerId: number;
  defaultTitle: string;
  defaultAmount: number;
  authed: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authed) {
    return (
      <div className="rounded-lg border border-line bg-mint p-4">
        <p className="font-sans text-base text-ink">Buyurtma berish uchun tizimga kiring.</p>
        <Link href={`/kirish?next=/gigs/${gigId}`} className={cn(buttonVariants(), 'mt-3')}>
          Kirish
        </Link>
      </div>
    );
  }

  if (isOwner) {
    return (
      <p className="rounded-lg border border-line bg-mint p-4 font-sans text-base text-ink">
        Bu sizning xizmatingiz — o'zingizga buyurtma bera olmaysiz.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gig_id: gigId,
          freelancer_id: freelancerId,
          title: defaultTitle,
          description,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Buyurtma berishda xatolik yuz berdi.');
        return;
      }
      router.push(`/buyurtmalarim/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-line bg-mint p-4"
    >
      <Input
        label="Buyurtma summasi (so'm)"
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Input
        label="Vazifa tavsifi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="Freelancerga nima kerakligini aniq yozing"
      />
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={loading} className="self-start">
        {loading ? 'Yuborilmoqda…' : 'Buyurtma berish'}
      </Button>
    </form>
  );
}
