'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function DonationReportForm({
  projectId,
  initialReport,
}: {
  projectId: number;
  initialReport: string;
}) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donation-projects/${projectId}/report`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) {
        setError('Hisobotni saqlashda xatolik yuz berdi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="font-sans text-sm font-medium text-ink" htmlFor="report">
        Shaffoflik hisoboti — yig'ildi, sarflandi, natija
      </label>
      <textarea
        id="report"
        value={report}
        onChange={(e) => setReport(e.target.value)}
        required
        minLength={10}
        rows={6}
        className="rounded border border-line bg-paper p-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        placeholder="Masalan: 1 200 000 so'm yig'ildi, 10 ta noutbuk sotib olindi va bitiruvchilarga topshirildi. 8 tasi shu noutbuklar bilan masofaviy ishga joylashdi."
      />
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Saqlanmoqda…' : 'Hisobotni saqlash'}
      </Button>
    </form>
  );
}
