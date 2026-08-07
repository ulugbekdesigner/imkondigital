'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';

export function CreateDonationProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/donation-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          story,
          target_amount: Number(targetAmount),
          deadline: deadline || null,
        }),
      });
      if (!res.ok) {
        setError('Loyiha yaratishda xatolik yuz berdi.');
        return;
      }
      setTitle('');
      setStory('');
      setTargetAmount('');
      setDeadline('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Loyiha nomi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        placeholder="Masalan: 10 ta noutbuk granti"
      />
      <Input
        label="Loyiha hikoyasi"
        value={story}
        onChange={(e) => setStory(e.target.value)}
        required
        minLength={10}
        hint="Kimga, nima uchun, qanday natija kutilayotgani"
      />
      <Input
        label="Maqsad summasi (so'm)"
        type="number"
        min={1000}
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
        required
      />
      <Input
        label="Muddat (ixtiyoriy)"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Yaratilmoqda…' : 'Loyiha yaratish'}
      </Button>
    </form>
  );
}
