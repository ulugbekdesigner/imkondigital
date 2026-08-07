'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import { HeartIcon } from '@/components/shell-icons';

export function SaveBenefitButton({
  benefitId,
  initialSaved,
  iconOnly = false,
}: {
  benefitId: number;
  initialSaved: boolean;
  /** Kompakt rejim — BenefitCard burchagidagi doira tugma (matn o'rniga yurak ikonkasi). */
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/benefits/${benefitId}/${saved ? 'unsave' : 'save'}`, {
        method: 'POST',
      });
      if (res.ok) {
        setSaved(!saved);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? "Saqlanganlardan o'chirish" : "Saqlab qo'yish"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-coral transition-colors hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <HeartIcon width={18} height={18} className={saved ? 'fill-current' : 'fill-none'} />
      </button>
    );
  }

  return (
    <Button variant={saved ? 'outline' : 'primary'} disabled={loading} onClick={toggle}>
      {saved ? "Saqlanganlardan o'chirish" : "Saqlab qo'yish"}
    </Button>
  );
}
