'use client';

import { useState } from 'react';

export function ServiceInterestForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/service-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <p className="font-sans text-base font-medium" style={{ color: 'var(--land-teal-300)' }}>
        Rahmat! Xizmat ishga tushganda birinchilardan bo&apos;lib xabar beramiz.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="service-interest-email" className="sr-only">
          Email manzilingiz
        </label>
        <input
          id="service-interest-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@misol.uz"
          className="h-12 w-full rounded-full border bg-transparent px-[18px] font-sans text-base text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: 'var(--land-line-dark-strong)' }}
        />
      </div>
      <button type="submit" disabled={status === 'sending'} className="imk-btn imk-btn--primary shrink-0">
        {status === 'sending' ? 'Yuborilmoqda...' : 'Xabar oling'}
      </button>
      {status === 'error' && (
        <p role="alert" className="w-full font-sans text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
          Xatolik yuz berdi, birozdan so&apos;ng qayta urinib ko&apos;ring.
        </p>
      )}
    </form>
  );
}
