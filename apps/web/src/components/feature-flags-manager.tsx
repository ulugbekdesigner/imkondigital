'use client';

import { useState } from 'react';
import { Badge, Button, Input } from '@imkon/ui';
import { GearIcon } from '@/components/shell-icons';
import type { FeatureFlagOut } from '@/lib/types';

async function saveFlag(
  name: string,
  data: { enabled: boolean; rollout_percent: number; description: string },
): Promise<FeatureFlagOut | null> {
  const res = await fetch(`/api/feature-flags/admin/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

function FlagRow({
  flag,
  onSaved,
}: {
  flag: FeatureFlagOut;
  onSaved: (updated: FeatureFlagOut) => void;
}) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [percent, setPercent] = useState(flag.rollout_percent);
  const [description, setDescription] = useState(flag.description);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await saveFlag(flag.name, {
        enabled,
        rollout_percent: percent,
        description,
      });
      if (updated) onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col gap-2.5 border-t border-line p-4 first:border-t-0 sm:p-[18px]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold text-ink">{flag.name}</span>
        <Badge variant={enabled ? 'success' : 'neutral'}>{enabled ? 'Yoqilgan' : "O'chirilgan"}</Badge>
        <label className="ml-auto flex min-h-touch cursor-pointer items-center gap-2 font-sans text-sm text-ink">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5"
          />
          Yoqilgan
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <Input
          label="Rollout %"
          type="number"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
        />
        <Input
          label="Izoh"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="button" size="sm" disabled={saving} onClick={save} className="self-start">
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </Button>
    </li>
  );
}

export function FeatureFlagsManager({ initialFlags }: { initialFlags: FeatureFlagOut[] }) {
  const [flags, setFlags] = useState(initialFlags);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  function handleSaved(updated: FeatureFlagOut) {
    setFlags((prev) => prev.map((f) => (f.name === updated.name ? updated : f)));
  }

  async function createFlag() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await saveFlag(name, { enabled: false, rollout_percent: 0, description: '' });
      if (created) {
        setFlags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName('');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void createFlag();
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-paper p-4"
      >
        <div className="min-w-[14rem] flex-1">
          <Input
            label="Yangi bayroq nomi"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="masalan: voice_tts"
          />
        </div>
        <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
          {creating ? "Qo'shilmoqda..." : "Qo'shish"}
        </Button>
      </form>

      {flags.length === 0 ? (
        <div className="imk-empty">
          <span className="imk-empty__icon" aria-hidden="true">
            <GearIcon width={26} height={26} />
          </span>
          <p className="font-sans text-base font-medium text-ink">Hali bayroq yo'q</p>
          <p className="max-w-sm font-sans text-sm text-ink-soft">
            Yangi funksiya qo'shishdan oldin shu yerda nomi bilan bayroq yarating - avval o'zingiz
            (0%), keyin bosqichma-bosqich foydalanuvchilarga oching.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-card border border-line bg-paper">
          {flags.map((f) => (
            <FlagRow key={f.name} flag={f} onSaved={handleSaved} />
          ))}
        </ul>
      )}
    </div>
  );
}
