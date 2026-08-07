import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Badge, CardDescription, CardHeader, CardTitle, GlassCard } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMentorshipDetail } from '@/lib/mentorship-api';
import { MentorshipRespondButtons } from '@/components/mentorship-respond-buttons';
import { MentorCheckinForm } from '@/components/mentor-checkin-form';
import { ArrowLeftIcon, ClipboardIcon, LockIcon } from '@/components/shell-icons';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Mentorlik',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  completed: 'Yakunlangan',
  declined: 'Rad etilgan',
};

const STATUS_BADGE_VARIANT: Record<string, 'neutral' | 'primary' | 'warn' | 'error' | 'info'> = {
  pending: 'warn',
  active: 'primary',
  completed: 'neutral',
  declined: 'error',
};

/** Avatar rasmi bo'lmagani uchun ism bosh harfidan fallback belgi (profil sahifasidagi bilan bir xil naqsh). */
function InitialAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-fg"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export default async function MentorshipDetailPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/ustoz/${params.id}`);

  const mentorship = await getMentorshipDetail(Number(params.id));
  if (!mentorship) notFound();

  const isMentor = mentorship.mentor_id === me.id;
  const counterpart = isMentor ? mentorship.mentee_name : mentorship.mentor_name;

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/ustoz"
          className="inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-base text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon width={18} height={18} />
          Ustoz kabinetiga qaytish
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <InitialAvatar name={counterpart} />
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                {isMentor ? 'Shogird' : 'Ustoz'}
              </p>
              <h1 className="font-display text-2xl font-bold text-ink">{counterpart}</h1>
            </div>
          </div>
          <Badge variant={STATUS_BADGE_VARIANT[mentorship.status] ?? 'neutral'}>
            {STATUS_LABEL[mentorship.status] ?? mentorship.status}
          </Badge>
        </div>

        <p className="mt-3 font-mono text-xs text-ink-soft">
          So'ralgan: {formatDate(mentorship.requested_at)}
          {mentorship.responded_at &&
            ` · Javob berilgan: ${formatDate(mentorship.responded_at)}`}
        </p>

        {isMentor && mentorship.status === 'pending' && (
          <GlassCard className="mt-6 p-6">
            <CardHeader>
              <CardTitle>So'rovga javob bering</CardTitle>
              <CardDescription>
                {counterpart} · {mentorship.mentee_ladder_step}-pog'ona · so'rov{' '}
                {formatRelativeTime(mentorship.requested_at)}
              </CardDescription>
            </CardHeader>
            {mentorship.message && (
              <p className="rounded-lg bg-mint p-3 font-sans text-base italic text-ink">
                "{mentorship.message}"
              </p>
            )}
            <MentorshipRespondButtons mentorshipId={mentorship.id} />
          </GlassCard>
        )}

        {isMentor && mentorship.status === 'active' && (
          <GlassCard className="mt-6 p-6">
            <CardHeader>
              <CardTitle>Yangi check-in</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <LockIcon width={14} height={14} className="shrink-0" />
                Faqat siz va {counterpart} bu yozuvni ko'rasiz.
              </CardDescription>
            </CardHeader>
            <MentorCheckinForm mentorshipId={mentorship.id} />
          </GlassCard>
        )}

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Check-inlar</CardTitle>
            <CardDescription>Uchrashuvlar davomida qoldirilgan qisqa yozuvlar.</CardDescription>
          </CardHeader>

          {mentorship.checkins.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {mentorship.checkins.map((c) => (
                <li key={c.id} className="rounded border border-line px-3 py-2">
                  <p className="font-mono text-xs text-ink-soft">
                    {formatDateTime(c.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-sans text-base text-ink">{c.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-8 text-center">
              <ClipboardIcon width={22} height={22} className="text-ink-soft" />
              <p className="font-sans text-base font-medium text-ink">Hali check-in yo'q</p>
              <p className="font-sans text-base text-ink-soft">
                {isMentor && mentorship.status === 'active'
                  ? "Birinchi uchrashuvdan so'ng yuqoridagi formadan yozib qo'ying."
                  : 'Ustoz uchrashuvdan keyin shu yerga qisqa izoh qoldiradi.'}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
