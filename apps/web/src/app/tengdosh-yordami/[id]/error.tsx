'use client';

import { RouteErrorState } from '@/components/route-error-state';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      reset={reset}
      title="Davra ochilmadi"
      message="Suhbat postlarini yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."
    />
  );
}
