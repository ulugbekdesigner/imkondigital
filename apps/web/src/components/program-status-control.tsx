'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

const NEXT_STATUS: Record<string, { next: string; label: string } | undefined> = {
  draft: { next: 'active', label: 'Faollashtirish' },
  active: { next: 'completed', label: 'Yakunlash' },
};

export function ProgramStatusControl({
  programId,
  status,
}: {
  programId: number;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const transition = NEXT_STATUS[status];

  async function advance(nextStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/donor/programs/${programId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!transition) return null;

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={() => advance(transition.next)}>
      {transition.label}
    </Button>
  );
}
