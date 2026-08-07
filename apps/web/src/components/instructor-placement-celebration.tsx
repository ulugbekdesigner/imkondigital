'use client';
/* ============================================================
   IMKON DIGITAL — "O'quvchi ishga joylashdi" tabrigi (Ustoz kabineti,
   docs/design/README.md 2-bo'lim, docs/design/README.md 4-jadval: "Ustoz | O'quvchi ishga
   joylashdi | Yorug' karta"). Voqea ustoz UI'sida emas — ish beruvchi
   arizani qabul qilganda backendda yuz beradi (employer/service.py
   _notify_instructors_of_placement), shu sabab dashboard ochilganda
   o'qilmagan "student_placed" bildirishnomalari tekshiriladi va
   birma-bir CelebrationScreen (variant="ustoz") bilan ko'rsatiladi.
   ============================================================ */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CelebrationScreen } from '@/components/celebration-screen';
import type { NotificationOut } from '@/lib/types';

export function InstructorPlacementCelebration({
  notifications,
}: {
  notifications: NotificationOut[];
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(notifications);
  const [busy, setBusy] = useState(false);

  const current = queue[0];
  if (!current) return null;
  const currentId = current.id;

  async function dismiss() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/notifications/${currentId}/read`, { method: 'POST' });
    } finally {
      setQueue((prev) => prev.slice(1));
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <CelebrationScreen
      variant="ustoz"
      title="O'quvchingiz ishga joylashdi!"
      message={current.body || current.title}
      onDismiss={dismiss}
    />
  );
}
