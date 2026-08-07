'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';

export function CreateProgramForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/donor/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        setError('Dastur yaratishda xatolik yuz berdi.');
        return;
      }
      setTitle('');
      setDescription('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Dastur nomi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
      />
      <Input
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        minLength={10}
      />
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Yaratilmoqda…' : 'Dastur yaratish'}
      </Button>
    </form>
  );
}
