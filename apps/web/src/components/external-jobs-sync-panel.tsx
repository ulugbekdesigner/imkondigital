'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import { formatDateTime } from '@/lib/format';
import type { ExternalJobsSyncStatus, ExternalJobSyncResult } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  remoteok: 'Remote OK',
  remotive: 'Remotive',
  weworkremotely: 'We Work Remotely',
};

export function ExternalJobsSyncPanel({ initialStatus }: { initialStatus: ExternalJobsSyncStatus | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExternalJobSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/external-jobs/sync', { method: 'POST' });
      if (!res.ok) {
        setError('Sinxronizatsiyada xatolik yuz berdi.');
        return;
      }
      setResult((await res.json()) as ExternalJobSyncResult);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-[18px]">
      <span className="font-sans text-base font-bold text-ink">Xalqaro ishlar sinxroni</span>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${initialStatus?.last_synced_at ? 'bg-success' : 'bg-ink-soft'}`}
        />
        <span className="flex-1 font-sans text-sm text-ink">
          {initialStatus?.last_synced_at
            ? `Oxirgi sinxron: ${formatDateTime(initialStatus.last_synced_at)}`
            : 'Hali sinxronlanmagan'}
        </span>
      </div>
      <span className="font-sans text-xs leading-relaxed text-ink-soft">
        {initialStatus?.active_count ?? 0} ta faol e&apos;lon.
      </span>
      <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={loading}>
        {loading ? 'Sinxronlanmoqda… (bir necha daqiqa)' : 'Hozir sinxronlash'}
      </Button>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      {result && (
        <ul className="flex flex-col gap-1">
          {result.sources.map((s) => (
            <li key={s.source} className="font-sans text-xs text-ink-soft">
              {SOURCE_LABEL[s.source] ?? s.source}: {s.fetched} topildi, {s.created} yangi,{' '}
              {s.updated} yangilandi, {s.deactivated} eskirgan
              {s.translation_failures > 0 && `, ${s.translation_failures} tarjima xatosi`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
