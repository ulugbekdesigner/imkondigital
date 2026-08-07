'use client';

import { useEffect, useState } from 'react';
import { CelebrationScreen } from '@/components/celebration-screen';

/**
 * Loyiha "funded" holatiga birinchi marta o'tganda donor buni ko'rganda
 * (sahifaga qaytganda) bir martalik tabrik ko'rsatadi — localStorage'dagi
 * "ko'rilgan" belgisi bilan qayta chiqmasligini ta'minlaydi (imkon-onboarding-done
 * bilan bir xil andoza). mark_donation_paid webhook orqali asinxron ishlaydi,
 * shu sabab bu yerda push emas — donor sahifani ochganda tekshiriladi.
 */
export function DonationFundedCelebration({
  projectId,
  projectTitle,
  status,
}: {
  projectId: number;
  projectTitle: string;
  status: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== 'funded') return;
    const key = `imkon-funded-seen-${projectId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      /* localStorage yo'q bo'lsa ham tabrikni ko'rsatish yetarli (faqat qayta
         chiqmaslik kafolati yo'qoladi, funksionallik buzilmaydi). */
    }
    setShow(true);
  }, [projectId, status]);

  if (!show) return null;

  return (
    <CelebrationScreen
      variant="donor"
      title="Maqsadga yetildi"
      message={`"${projectTitle}" loyihasi 100% yig'ildi.`}
      actionLabel="Shaffoflik hisobotini yozish"
      actionHref="#hisobot"
      onDismiss={() => setShow(false)}
    />
  );
}
