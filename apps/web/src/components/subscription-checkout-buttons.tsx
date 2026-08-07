'use client';

import { useState } from 'react';
import type { SubscriptionCheckoutOut } from '@/lib/types';

export function SubscriptionCheckoutButtons({
  plan,
  className,
  primaryStyle,
}: {
  plan: 'plus' | 'pro';
  className?: string;
  primaryStyle: React.CSSProperties;
}) {
  const [loadingProvider, setLoadingProvider] = useState<'payme' | 'click' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(provider: 'payme' | 'click') {
    setLoadingProvider(provider);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, provider }),
      });
      const data = (await res.json()) as SubscriptionCheckoutOut & { detail?: string };
      if (!res.ok) {
        setError(data.detail ?? "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
        return;
      }
      window.location.href = data.checkout_url;
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => void checkout('payme')}
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60"
          style={primaryStyle}
        >
          {loadingProvider === 'payme' ? "Yo'naltirilmoqda…" : 'Payme orqali'}
        </button>
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => void checkout('click')}
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-full border border-current text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {loadingProvider === 'click' ? "Yo'naltirilmoqda…" : 'Click orqali'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
