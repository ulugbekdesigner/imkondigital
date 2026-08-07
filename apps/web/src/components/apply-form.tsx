'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants, Checkbox, cn } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import { useToast } from '@/components/toast';

export function ApplyForm({
  vacancyId,
  vacancyTitle,
  companyName,
  authed,
  alreadyApplied,
}: {
  vacancyId: number;
  vacancyTitle?: string;
  companyName?: string;
  authed: boolean;
  alreadyApplied: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [shareDisability, setShareDisability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyApplied);

  if (!authed) {
    return (
      <div className="border-line bg-mint rounded-lg border p-4">
        <p className="text-ink font-sans text-base">Ariza berish uchun tizimga kiring.</p>
        <Link
          href={`/kirish?next=/vakansiyalar/${vacancyId}`}
          className={cn(buttonVariants(), 'mt-3')}
        >
          Kirish
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border-line bg-mint rounded-lg border p-4">
        <p className="text-ink flex items-center gap-1.5 font-sans text-base font-medium">
          <CheckIcon width={16} height={16} className="text-primary shrink-0" />
          Arizangiz yuborildi — holatini profilingizda kuzatib boring.
        </p>
        <Link href="/profil" className={cn(buttonVariants({ variant: 'outline' }), 'mt-3')}>
          Arizalarimni ko'rish
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vacancies/${vacancyId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_disability_profile: shareDisability }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(
          res.status === 409
            ? 'Siz bu vakansiyaga allaqachon ariza bergansiz.'
            : (data.detail ?? 'Xatolik yuz berdi.'),
        );
        return;
      }
      setDone(true);
      showToast({
        variant: 'success',
        title: 'Ariza yuborildi',
        body: companyName && vacancyTitle ? `${companyName} · ${vacancyTitle}` : vacancyTitle,
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line bg-mint flex flex-col gap-4 rounded-lg border p-4"
    >
      <Checkbox
        checked={shareDisability}
        onChange={(e) => setShareDisability(e.target.checked)}
        label={
          <span className="font-sans text-base text-ink">
            Nogironlik profilimni ish beruvchiga ko'rsatishga roziman{' '}
            <span className="text-ink-soft">(ixtiyoriy — moslashuv kerak bo'lsa yordam beradi)</span>
          </span>
        }
      />
      {error && (
        <p role="alert" className="text-error font-sans text-base">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={loading} className="self-start">
        {loading ? 'Yuborilmoqda…' : 'Ariza berish'}
      </Button>
    </form>
  );
}
