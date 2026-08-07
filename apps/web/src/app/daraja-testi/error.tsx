'use client';

import { RouteErrorState } from '@/components/route-error-state';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      reset={reset}
      title="Daraja testi ochilmadi"
      message="Test tarixini yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."
    />
  );
}
