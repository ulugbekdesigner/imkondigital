'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function AdminCompanyVerifyButton({
  companyId,
  verified,
}: {
  companyId: number;
  verified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !verified }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={verified ? 'outline' : 'primary'}
      disabled={loading}
      onClick={toggle}
    >
      {loading ? '…' : verified ? 'Tasdiqni bekor qilish' : 'Tasdiqlash'}
    </Button>
  );
}
