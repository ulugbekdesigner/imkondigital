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
      title="Xizmatlarni yuklab bo'lmadi"
      description="Freelancer xizmatlar katalogini yuklashda xatolik yuz berdi. Qayta urinib ko'ring."
    />
  );
}
