'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '@imkon/ui';

export function CourseArchiveButton({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/archive`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.detail === 'string' ? data.detail : 'Arxivlashda xatolik yuz berdi.');
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-error hover:bg-error/10"
        onClick={() => setConfirmOpen(true)}
      >
        Arxivlash
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={archive}
        title="Kursni arxivlaysizmi?"
        description="O'quvchilar kursni ko'ra olmaydi. Keyin qaytarish mumkin."
        confirmLabel="Arxivlash"
        confirmLoading={loading}
        destructive
      />
      {error && (
        <p role="alert" className="mt-1 font-sans text-xs text-error">
          {error}
        </p>
      )}
    </>
  );
}
