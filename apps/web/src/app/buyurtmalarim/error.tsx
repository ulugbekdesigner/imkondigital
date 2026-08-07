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
      title="Buyurtmani yuklab bo'lmadi"
      description="Buyurtma ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring."
    />
  );
}
