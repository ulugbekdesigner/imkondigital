'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@imkon/ui';
import { useToast } from '@/components/toast';

export function CourseRemoveButton({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        showToast({
          variant: 'system',
          title: data.action === 'deleted' ? "Kurs o'chirildi" : 'Kurs arxivlandi',
          body:
            data.action === 'deleted'
              ? undefined
              : "O'quvchilaringiz bo'lgani uchun ma'lumot saqlandi, faqat katalogdan yashirildi.",
        });
        setOpen(false);
        router.refresh();
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="min-h-touch shrink-0 rounded-full px-3 font-sans text-sm font-semibold text-error hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        O&apos;chirish
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmRemove}
        title={`"${courseTitle}" kursini o'chirasizmi?`}
        description="Agar hali hech kim ro'yxatdan o'tmagan qoralama bo'lsa, kurs butunlay o'chiriladi. Aks holda - arxivlanadi: katalogdan yashiriladi, o'quvchilar ma'lumoti saqlanib qoladi."
        confirmLabel="Ha, davom etish"
        destructive
        confirmLoading={removing}
      />
    </>
  );
}
