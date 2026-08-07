'use client';

import { useRef, useState } from 'react';
import { Button, Checkbox, Input } from '@imkon/ui';
import { formatThousands } from '@/lib/format';

const PRESETS = [100_000, 500_000];

export function DonateForm({ projectId }: { projectId: number }) {
  const [amount, setAmount] = useState<number>(PRESETS[1]!);
  const [customAmount, setCustomAmount] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'payme' | 'click' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  async function donate(provider: 'payme' | 'click') {
    if (!effectiveAmount || effectiveAmount <= 0) {
      setError("Summani to'g'ri kiriting.");
      return;
    }
    setLoadingProvider(provider);
    setError(null);
    try {
      const res = await fetch(`/api/donation-projects/${projectId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          donor_name: isAnonymous ? null : donorName || null,
          donor_email: donorEmail || null,
          is_anonymous: isAnonymous,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        return;
      }
      window.location.href = data.checkout_url;
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="rounded-[20px] border border-line bg-paper p-6 shadow-glass">
      <h3 className="font-display text-lg font-bold text-ink">Hissa qo'shish</h3>

      <div className="mt-4 flex gap-2" role="group" aria-label="Summa tanlang">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setAmount(p);
              setCustomAmount('');
            }}
            aria-pressed={!customAmount && amount === p}
            className={`min-h-touch flex-1 rounded-full border px-3 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
              !customAmount && amount === p
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-line text-ink hover:bg-mint'
            }`}
          >
            {formatThousands(p)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => customInputRef.current?.focus()}
          aria-pressed={!!customAmount}
          className={`min-h-touch flex-1 rounded-full border px-3 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
            customAmount
              ? 'border-primary bg-primary text-primary-fg'
              : 'border-line text-ink hover:bg-mint'
          }`}
        >
          Boshqa
        </button>
      </div>

      <div className="mt-3">
        <Input
          ref={customInputRef}
          label="Yoki o'z summangiz (so'm)"
          type="number"
          min={1000}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="150000"
        />
      </div>

      <div className="mt-4">
        <Checkbox
          id="anon"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          label="Anonim qoldirish (ism ko'rsatilmaydi)"
        />
      </div>

      {!isAnonymous && (
        <div className="mt-3">
          <Input
            label="Ismingiz (ixtiyoriy)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Homiylar devorida ko'rinadi"
          />
        </div>
      )}

      <div className="mt-3">
        <Input
          label="Email (ixtiyoriy — natija xati uchun)"
          type="email"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 font-sans text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={loadingProvider !== null} onClick={() => donate('payme')}>
          {loadingProvider === 'payme' ? "Yo'naltirilmoqda…" : 'Payme orqali'}
        </Button>
        <Button
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => donate('click')}
        >
          {loadingProvider === 'click' ? "Yo'naltirilmoqda…" : 'Click orqali'}
        </Button>
      </div>
      <p className="mt-3 font-sans text-xs text-ink-soft">
        Ro'yxatdan o'tish shart emas — 30 soniyada, xavfsiz to'lov.
      </p>
    </div>
  );
}
