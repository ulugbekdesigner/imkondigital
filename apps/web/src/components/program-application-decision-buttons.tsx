'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function ProgramApplicationDecisionButtons({
  programId,
  enrollmentId,
}: {
  programId: number;
  enrollmentId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(approve: boolean) {
    setLoading(true);
    try {
      await fetch(`/api/donor/programs/${programId}/applications/${enrollmentId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading} onClick={() => decide(true)}>
        Qabul qilish
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-error hover:bg-error/10"
        disabled={loading}
        onClick={() => decide(false)}
      >
        Rad etish
      </Button>
    </div>
  );
}
