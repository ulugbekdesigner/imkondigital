'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function MentorshipRespondButtons({ mentorshipId }: { mentorshipId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(accept: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentorships/${mentorshipId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.detail === 'string' ? data.detail : 'Xatolik yuz berdi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={() => respond(true)}>
          Qabul qilish
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-error hover:bg-error/10"
          disabled={loading}
          onClick={() => respond(false)}
        >
          Rad etish
        </Button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
