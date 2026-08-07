'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/route-error-state';

/** /vakansiyalar xato holati — docs/design/README.md majburiy holat qoidasi
 * (.imk-error + "Qayta urinish"). */
export default function VacanciesError({
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
      title="Vakansiyalarni yuklab bo'lmadi"
      message="Internet aloqasi yoki serverda vaqtinchalik muammo bo'lishi mumkin."
    />
  );
}
