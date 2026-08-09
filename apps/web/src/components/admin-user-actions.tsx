'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, cn } from '@imkon/ui';
import { CloseIcon, MoreIcon } from '@/components/shell-icons';

const ASSIGNABLE_ROLES = [
  'instructor',
  'employer',
  'mentor',
  'donor',
  'gov',
  'moderator',
  'admin',
] as const;

/** Chegaraga (44px ustun) sig'maydigan panel — shu sabab popover sifatida
 * absolute joylashadi (grid ustun kengligidan mustaqil, qator balandligiga
 * ta'sir qilmaydi). Trigger + panel shu komponentning o'zida — sahifa faqat
 * <AdminUserActions/> ni chaqiradi. */
const PLAN_OPTIONS = ['free', 'plus', 'pro'] as const;

export function AdminUserActions({
  userId,
  fullName,
  status,
  roles,
  subscriptionPlan = 'free',
}: {
  userId: number;
  fullName: string;
  status: string;
  roles: string[];
  subscriptionPlan?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${fullName} uchun amallar`}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <MoreIcon width={16} height={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`${fullName} uchun amallar`}
          className={cn(
            'absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-line bg-paper p-3',
            'shadow-card-lg',
          )}
        >
          <AdminUserActionsPanel
            userId={userId}
            status={status}
            roles={roles}
            subscriptionPlan={subscriptionPlan}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function AdminUserActionsPanel({
  userId,
  status,
  roles,
  subscriptionPlan,
  onDone,
}: {
  userId: number;
  status: string;
  roles: string[];
  subscriptionPlan: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState<(typeof ASSIGNABLE_ROLES)[number]>(
    ASSIGNABLE_ROLES[0],
  );
  const [plan, setPlan] = useState(subscriptionPlan);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetLinkCopied, setResetLinkCopied] = useState(false);

  async function applyPlan() {
    if (plan === subscriptionPlan) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'blocked' ? 'active' : 'blocked' }),
      });
      router.refresh();
      onDone();
    } finally {
      setLoading(false);
    }
  }

  async function assignRole() {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleToAdd }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function revokeRole(role: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/roles/${role}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function createResetLink() {
    setLoading(true);
    setResetLinkCopied(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password-reset-link`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setResetLink(data.link);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyResetLink() {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink);
    setResetLinkCopied(true);
  }

  const addableRoles = ASSIGNABLE_ROLES.filter((r) => !roles.includes(r));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <Badge key={role} variant="neutral">
            {role}
            {role !== 'user' && (
              <button
                type="button"
                onClick={() => revokeRole(role)}
                disabled={loading}
                aria-label={`${role} rolini olib tashlash`}
                className="ml-1 inline-flex min-h-touch min-w-touch items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <CloseIcon width={12} height={12} />
              </button>
            )}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
        <label className="sr-only" htmlFor={`plan-select-${userId}`}>
          Pullik daraja
        </label>
        <select
          id={`plan-select-${userId}`}
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="min-h-touch max-w-[8rem] rounded border border-line bg-paper px-2 font-sans text-sm text-ink"
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" disabled={loading || plan === subscriptionPlan} onClick={applyPlan}>
          Rejani saqlash
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {addableRoles.length > 0 && (
          <>
            <label className="sr-only" htmlFor={`role-select-${userId}`}>
              Yangi rol
            </label>
            <select
              id={`role-select-${userId}`}
              value={roleToAdd}
              onChange={(e) => setRoleToAdd(e.target.value as (typeof ASSIGNABLE_ROLES)[number])}
              className="min-h-touch max-w-[9.5rem] rounded border border-line bg-paper px-2 font-sans text-sm text-ink"
            >
              {addableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" disabled={loading} onClick={assignRole}>
              Rol qo'shish
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant={status === 'blocked' ? 'outline' : 'ghost'}
          className={status === 'blocked' ? '' : 'text-error hover:bg-error/10'}
          disabled={loading}
          onClick={toggleStatus}
        >
          {status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line pt-2">
        <Button size="sm" variant="outline" disabled={loading} onClick={createResetLink}>
          Parolni tiklash havolasi
        </Button>
        {resetLink && (
          <div className="flex flex-col gap-1">
            <p className="font-sans text-xs text-ink-soft">
              1 soat amal qiladi. Foydalanuvchiga o&apos;zingiz istagan kanal orqali yuboring -
              parolning o&apos;zi hech qayerda ko&apos;rinmaydi.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={resetLink}
                onFocus={(e) => e.currentTarget.select()}
                className="min-h-touch flex-1 rounded border border-line bg-surface-2 px-2 font-mono text-xs text-ink-soft"
              />
              <Button type="button" size="sm" variant="ghost" onClick={copyResetLink}>
                {resetLinkCopied ? 'Nusxalandi' : 'Nusxalash'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
