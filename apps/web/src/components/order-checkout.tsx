'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import type { CheckoutOut } from '@/lib/types';

export function OrderCheckout({ orderId }: { orderId: number }) {
  const [loadingProvider, setLoadingProvider] = useState<'payme' | 'click' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(provider: 'payme' | 'click') {
    setLoadingProvider(provider);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout?provider=${provider}`);
      const data = (await res.json()) as CheckoutOut & { detail?: string };
      if (!res.ok) {
        setError(data.detail ?? "To'lovni boshlashda xatolik yuz berdi.");
        return;
      }
      window.location.href = data.checkout_url;
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-mint p-4">
      <p className="font-sans text-base font-medium text-ink">
        Buyurtmani boshlash uchun to'lovni amalga oshiring — mablag' himoyalangan holatda
        saqlanadi va ish qabul qilingandan keyin freelancerga chiqariladi.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          isLoading={loadingProvider === 'payme'}
          disabled={loadingProvider !== null}
          onClick={() => pay('payme')}
        >
          {loadingProvider === 'payme' ? 'Yo\'naltirilmoqda…' : 'Payme orqali to\'lash'}
        </Button>
        <Button
          variant="outline"
          isLoading={loadingProvider === 'click'}
          disabled={loadingProvider !== null}
          onClick={() => pay('click')}
        >
          {loadingProvider === 'click' ? 'Yo\'naltirilmoqda…' : 'Click orqali to\'lash'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-sans text-base text-error">
          {error}
        </p>
      )}
    </div>
  );
}
