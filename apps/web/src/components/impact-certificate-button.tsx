'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';

export function ImpactCertificateButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ pdf_url: string; total_students_helped: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/me/impact-certificate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Xatolik yuz berdi.');
        return;
      }
      setResult(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={generate} disabled={busy}>
        {busy ? 'Tayyorlanmoqda…' : 'Ijtimoiy ta\'sir sertifikatini olish'}
      </Button>
      {error && (
        <p role="alert" className="mt-2 font-sans text-sm text-error">
          {error}
        </p>
      )}
      {result && (
        <p className="mt-2 font-sans text-sm text-ink">
          Bepul kurslaringiz orqali {result.total_students_helped} kishi kasb o'rgandi —{' '}
          <a
            href={result.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            sertifikatni yuklab olish
          </a>
        </p>
      )}
    </div>
  );
}
