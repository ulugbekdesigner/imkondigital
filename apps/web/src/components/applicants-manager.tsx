'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, buttonVariants, cn } from '@imkon/ui';
import { CelebrationScreen } from '@/components/celebration-screen';
import { useToast } from '@/components/toast';
import { CheckIcon, SparkIcon, UsersIcon } from '@/components/shell-icons';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import type { ApplicantOut } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Yuborilgan',
  viewed: "Ko'rilgan",
  interview: 'Suhbatda',
  accepted: 'Qabul qilingan',
  rejected: 'Rad etilgan',
};

const STATUS_BADGE_VARIANT: Record<string, 'neutral' | 'info' | 'success' | 'error'> = {
  submitted: 'neutral',
  viewed: 'neutral',
  interview: 'info',
  accepted: 'success',
  rejected: 'error',
};

const CHECKIN_LABELS: {
  key: 'checkin_1w' | 'checkin_1m' | 'checkin_3m';
  period: '1w' | '1m' | '3m';
  label: string;
}[] = [
  { key: 'checkin_1w', period: '1w', label: '1 hafta' },
  { key: 'checkin_1m', period: '1m', label: '1 oy' },
  { key: 'checkin_3m', period: '3m', label: '3 oy' },
];

export function ApplicantsManager({ initialApplicants }: { initialApplicants: ApplicantOut[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [applicants, setApplicants] = useState(initialApplicants);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [celebrateName, setCelebrateName] = useState<string | null>(null);

  async function updateStatus(applicationId: number, newStatus: string) {
    setBusyId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const applicant = applicants.find((a) => a.id === applicationId);
        setApplicants((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a)),
        );
        if (newStatus === 'accepted') {
          setCelebrateName(applicant?.full_name ?? null);
        } else if (newStatus === 'interview') {
          showToast({
            variant: 'success',
            title: 'Suhbatga taklif yuborildi',
            body: applicant ? `${applicant.full_name} bilan bog'laning.` : undefined,
          });
        }
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function checkin(placementId: number, period: '1w' | '1m' | '3m') {
    setBusyId(placementId);
    try {
      const res = await fetch(`/api/placements/${placementId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (applicants.length === 0) {
    return (
      <div className="imk-empty">
        <span className="imk-empty__icon" aria-hidden="true">
          <UsersIcon width={26} height={26} />
        </span>
        <p className="font-sans text-base font-medium text-ink">Hali ariza tushmagan</p>
        <p className="max-w-sm font-sans text-sm text-ink-soft">
          Vakansiya nashr etilgach, mos nomzodlar shu ro'yxatda moslik darajasi bo'yicha
          tartiblanib ko'rina boshlaydi.
        </p>
      </div>
    );
  }

  return (
    <>
      {celebrateName && (
        <CelebrationScreen
          variant="ish-beruvchi"
          title="Yangi xodim jamoada"
          message={`${celebrateName} arizani qabul qildi — ishga chiqish sanasini kelishing. 1 hafta, 1 oy va 3 oydan keyin check-in orqali moslashuvini kuzatib boring.`}
          onDismiss={() => setCelebrateName(null)}
        />
      )}
      <ul className="border-line bg-paper overflow-hidden rounded-[18px] border">
        {applicants.map((a) => {
          const experienceParts = [`${a.ladder_step}-pog'ona`];
          if (a.portfolio_count > 0) experienceParts.push(`${a.portfolio_count} portfolio ishi`);
          if (a.certificates_count > 0) experienceParts.push(`sertifikat ${a.certificates_count}`);

          return (
            <li key={a.id} className="border-line border-t p-4 first:border-t-0 sm:p-[18px]">
              <div className="flex flex-wrap items-center gap-3.5">
                <span
                  aria-hidden="true"
                  style={{ background: avatarGradient(a.user_id) }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold text-white"
                >
                  {initialsOf(a.full_name)}
                </span>
                <div className="min-w-[10rem] flex-1">
                  <p className="text-ink font-sans text-[15px] font-bold">{a.full_name}</p>
                  <p className="text-ink-soft font-mono text-xs">@{a.username}</p>
                  <p className="text-ink-soft font-sans text-[13px]">
                    {experienceParts.join(' · ')}
                  </p>
                </div>
                <Badge variant={a.match_score >= 85 ? 'primary' : 'info'}>
                  {a.match_score}% mos
                </Badge>
                <Badge variant={STATUS_BADGE_VARIANT[a.status] ?? 'neutral'}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </Badge>
              </div>

              {a.disability && (
                <div className="bg-mint mt-3 flex items-start gap-3 rounded-xl p-3">
                  <span
                    aria-hidden="true"
                    className="border-line bg-paper text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border"
                  >
                    <SparkIcon width={16} height={16} />
                  </span>
                  <p className="text-ink font-sans text-sm">
                    <b className="font-semibold">Moslashtirilgan sharoit:</b> nogironlik guruhi —{' '}
                    {a.disability.group_type ?? '—'} ·{' '}
                    {a.disability.categories.join(', ') || "ko'rsatilmagan"}. Suhbatga taklif
                    qilishdan oldin zarur moslashtirishlarni muhokama qiling.
                  </p>
                </div>
              )}

              {(a.status === 'submitted' || a.status === 'viewed' || a.status === 'interview') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/u/${a.username}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Profil
                  </Link>
                  {a.status !== 'interview' && (
                    <Button
                      size="sm"
                      disabled={busyId === a.id}
                      onClick={() => updateStatus(a.id, 'interview')}
                    >
                      Suhbatga taklif qilish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === a.id}
                    onClick={() => updateStatus(a.id, 'accepted')}
                  >
                    Qabul qilish
                  </Button>
                  {a.status === 'submitted' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busyId === a.id}
                      onClick={() => updateStatus(a.id, 'viewed')}
                    >
                      Keyinroq
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10"
                    disabled={busyId === a.id}
                    onClick={() => updateStatus(a.id, 'rejected')}
                  >
                    Rad etish
                  </Button>
                </div>
              )}

              {a.status === 'accepted' && a.placement && (
                <div className="border-line mt-3 flex flex-col gap-2.5 rounded-xl border p-3.5">
                  <span className="text-ink font-sans text-sm font-bold">
                    Ishga joylashuvdan keyingi kuzatuv
                  </span>
                  <div className="flex items-center gap-2">
                    {CHECKIN_LABELS.map((c) => {
                      const done = a.placement![c.key];
                      return (
                        <button
                          key={c.key}
                          type="button"
                          disabled={busyId === a.placement!.id || done}
                          onClick={() => checkin(a.placement!.id, c.period)}
                          aria-pressed={done}
                          className={cn(
                            'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border font-sans text-sm font-semibold disabled:cursor-not-allowed',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
                            done
                              ? 'border-success bg-success-bg text-success'
                              : 'border-line bg-paper text-ink-soft hover:bg-surface-2',
                          )}
                        >
                          {c.label}
                          {done && <CheckIcon width={14} height={14} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
