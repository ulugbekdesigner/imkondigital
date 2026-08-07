'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import type { SuccessStoryOut } from '@/lib/success-stories-api';

export function SuccessStoryModerationCard({ stories }: { stories: SuccessStoryOut[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const story = stories[0];
  const rest = stories.length - 1;

  async function setStatus(status: 'published') {
    if (!story) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/success-stories/${story.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!story) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/success-stories/${story.id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-[18px]">
      <span className="font-sans text-base font-bold text-ink">Muvaffaqiyat hikoyalari</span>
      {story ? (
        <>
          <div className="flex items-center gap-2.5 rounded-[14px] border border-line p-3">
            <span
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-full"
              style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))' }}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-sans text-sm font-bold text-ink">
                {story.full_name} · {story.profession}
              </span>
              <span className="font-sans text-xs text-ink-soft">Qoralama · nashr kutilmoqda</span>
            </div>
          </div>
          {rest > 0 && (
            <span className="font-sans text-xs text-ink-soft">+{rest} ta yana navbatda</span>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={loading}
              onClick={reject}
            >
              Rad etish
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={loading}
              onClick={() => setStatus('published')}
            >
              Nashr
            </Button>
          </div>
        </>
      ) : (
        <p className="font-sans text-sm text-ink-soft">Nashr kutayotgan hikoya yo&apos;q.</p>
      )}
    </div>
  );
}
