'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function MentorCheckinForm({ mentorshipId }: { mentorshipId: number }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentorships/${mentorshipId}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        setError("Check-in qo'shishda xatolik yuz berdi.");
        return;
      }
      setNote('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="checkin-note" className="font-sans text-base font-medium text-ink">
        Yangi check-in
      </label>
      <textarea
        id="checkin-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        minLength={3}
        required
        placeholder="Uchrashuv haqida qisqa izoh…"
        className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      />
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        Qo'shish
      </Button>
    </form>
  );
}
