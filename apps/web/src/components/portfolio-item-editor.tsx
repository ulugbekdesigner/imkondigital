'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import { StartCaseStoryButton } from './start-case-story-button';
import type { PortfolioItem } from '@/lib/types';

export function PortfolioItemEditor({
  item,
  onUpdate,
}: {
  item: PortfolioItem;
  onUpdate: (item: PortfolioItem) => void;
}) {
  const router = useRouter();
  const [task, setTask] = useState(item.task);
  const [result, setResult] = useState(item.result);
  const [clientFeedback, setClientFeedback] = useState(item.client_feedback ?? '');
  const [skillsText, setSkillsText] = useState(item.skills.join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stepCaption, setStepCaption] = useState('');
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [addingStep, setAddingStep] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/portfolio/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          result,
          client_feedback: clientFeedback.trim() || null,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        const updated = (await res.json()) as PortfolioItem;
        onUpdate(updated);
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!stepFile) return;
    setAddingStep(true);
    try {
      const form = new FormData();
      form.set('caption', stepCaption);
      form.set('file', stepFile);
      const res = await fetch(`/api/portfolio/${item.id}/steps`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setStepCaption('');
        setStepFile(null);
        router.refresh();
      }
    } finally {
      setAddingStep(false);
    }
  }

  async function handleDeleteStep(stepId: number) {
    await fetch(`/api/portfolio/steps/${stepId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-4">
      <div>
        <p className="font-sans text-sm text-ink-soft">
          Vazifa/natijani qo'lda yozing yoki Ziyo bilan birga suhbat orqali yozdiring.
        </p>
        <div className="mt-2">
          <StartCaseStoryButton portfolioItemId={item.id} />
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <Input
          label="Vazifa"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          hint="Nima ustida ishladingiz?"
        />
        <Input
          label="Natija"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          hint="Nimaga erishdingiz? Imkon bo'lsa o'lchanadigan qiling"
        />
        <Input
          label="Mijoz bahosi (ixtiyoriy)"
          value={clientFeedback}
          onChange={(e) => setClientFeedback(e.target.value)}
          hint="Faqat haqiqiy mijoz sharhini kiriting"
        />
        <Input
          label="Ko'nikmalar"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          hint="Vergul bilan ajrating: Figma, React"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={saving} className="self-start">
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
          {saved && (
            <p role="status" className="flex items-center gap-1 font-sans text-sm text-primary">
              <CheckIcon width={14} height={14} />
              Saqlandi
            </p>
          )}
        </div>
      </form>

      <div>
        <h4 className="font-sans text-base font-medium text-ink">
          Jarayon bosqichlari (2-3 oraliq kadr)
        </h4>
        {item.steps.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {item.steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center justify-between gap-2 rounded border border-line p-2"
              >
                <span className="font-sans text-sm text-ink">{step.caption || 'Bosqich'}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-error hover:bg-error/10"
                  onClick={() => handleDeleteStep(step.id)}
                >
                  O'chirish
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddStep} className="mt-2 flex flex-wrap items-end gap-2">
          <Input
            label="Izoh"
            value={stepCaption}
            onChange={(e) => setStepCaption(e.target.value)}
            hint="Masalan: Boshlang'ich eskiz"
          />
          <div>
            <label
              className="mb-1.5 block font-sans text-base font-medium text-ink"
              htmlFor={`step-file-${item.id}`}
            >
              Rasm
            </label>
            <input
              id={`step-file-${item.id}`}
              type="file"
              onChange={(e) => setStepFile(e.target.files?.[0] ?? null)}
              className="block font-sans text-base text-ink file:mr-3 file:min-h-touch file:rounded file:border-0 file:bg-primary file:px-4 file:font-sans file:text-base file:text-primary-fg"
            />
          </div>
          <Button type="submit" size="sm" disabled={addingStep || !stepFile}>
            {addingStep ? "Qo'shilmoqda…" : "Bosqich qo'shish"}
          </Button>
        </form>
      </div>
    </div>
  );
}
