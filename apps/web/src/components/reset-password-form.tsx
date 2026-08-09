'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@imkon/ui';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Parollar mos kelmadi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : 'Havola yaroqsiz yoki muddati tugagan. Admindan yangisini so\'rang.',
        );
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/kirish'), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p role="alert" className="rounded-2xl border border-error bg-error-bg p-3 font-sans text-sm text-error">
        Havola yaroqsiz - tiklash tokeni topilmadi.
      </p>
    );
  }

  if (done) {
    return (
      <p className="rounded-2xl border border-line bg-mint p-3 font-sans text-sm text-ink">
        Parolingiz yangilandi. Kirish sahifasiga yo&apos;naltirilmoqdasiz...
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="rounded-2xl border border-error bg-error-bg p-3 font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Input
        label="Yangi parol"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <Input
        label="Yangi parolni takrorlang"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <Button type="submit" size="lg" isLoading={loading} className="w-full">
        {loading ? 'Saqlanmoqda…' : 'Parolni yangilash'}
      </Button>
      <p className="font-sans text-xs text-ink-soft">
        <Link href="/kirish" className="font-semibold text-primary underline-offset-4 hover:underline">
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </form>
  );
}
