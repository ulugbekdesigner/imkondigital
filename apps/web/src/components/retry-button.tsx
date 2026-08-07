'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@imkon/ui';
import { RefreshIcon } from '@/components/shell-icons';

/** Server komponent xato holatlarida ishlatiladigan "Qayta urinish" tugmasi
 * — sahifani to'liq qayta yuklamasdan (`router.refresh()`) Server
 * Component'larni qayta so'raydi. */
export function RetryButton({ label = 'Qayta urinish' }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      isLoading={pending}
      onClick={() => {
        setPending(true);
        router.refresh();
        window.setTimeout(() => setPending(false), 800);
      }}
    >
      {!pending && <RefreshIcon width={16} height={16} aria-hidden="true" />}
      {label}
    </Button>
  );
}
