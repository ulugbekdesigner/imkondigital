'use client';

import { RouteError } from '@/components/route-error';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Bu bo'lim yuklanmadi"
      description="Shoshilinch bo'lsa, to'g'ridan-to'g'ri 1050 (Ishonch telefoni) raqamiga qo'ng'iroq qiling. Boshqa hollarda qayta urinib ko'ring."
    />
  );
}
