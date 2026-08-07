'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/route-error-state';

/** /hududlar/[slug] xato holati — docs/design/README.md majburiy holat qoidasi
 * (.imk-error + "Qayta urinish"). */
export default function RegionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteErrorState
      reset={reset}
      title="Hududni yuklab bo'lmadi"
      message="Internet aloqasi yoki serverda vaqtinchalik muammo bo'lishi mumkin."
    />
  );
}
