'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/route-error-state';

/** /tariflar xato holati — docs/design/README.md majburiy holat qoidasi
 * (.imk-error + "Qayta urinish"). Boshqa barcha marketing sahifalarida
 * (kurslar, vakansiyalar, gigs) mavjud, /tariflar'da yo'q edi — bu sahifa
 * ham getMe/getSubscriptionPricing/getMySubscription orqali server
 * ma'lumotini yuklaydi, shu sabab xato chegarasi shart. */
export default function TariflarError({
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
      title="Tariflarni yuklab bo'lmadi"
      message="Internet aloqasi yoki serverda vaqtinchalik muammo bo'lishi mumkin."
    />
  );
}
