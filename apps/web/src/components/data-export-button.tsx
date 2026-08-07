'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import { AlertIcon, DownloadIcon } from '@/components/shell-icons';

export function DataExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me/data-export');
      if (!res.ok) {
        setError('Yuklab olishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
        return;
      }
      const data: unknown = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imkon-malumotlarim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Yuklab olishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        isLoading={loading}
        onClick={handleExport}
      >
        {!loading && <DownloadIcon width={16} height={16} />}
        {loading ? 'Tayyorlanmoqda…' : "Ma'lumotlarimni yuklab olish (.json)"}
      </Button>
      {error && (
        <div role="alert" className="imk-error mt-2 w-full">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon width={22} height={22} />
          </span>
          <div>
            <p className="font-sans text-base text-ink">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={loading}
            onClick={handleExport}
          >
            Qayta urinish
          </Button>
        </div>
      )}
    </div>
  );
}
