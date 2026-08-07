import type { ComponentType, ReactNode, SVGProps } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, CardDescription, CardHeader, CardTitle, GlassCard } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMentors, getMyMentorships } from '@/lib/mentorship-api';
import { RequestMentorshipButton } from '@/components/request-mentorship-button';
import { ChevronRightIcon, RouteIcon, UsersIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Mentorlik',
  description: "Tajribali ustozlardan mentorlik so'rang yoki mavjud mentorliklaringizni kuzating.",
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-fg"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function EmptyState({
  Icon,
  title,
  children,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-8 text-center">
      <Icon width={22} height={22} className="text-ink-soft" />
      <p className="font-sans text-base font-medium text-ink">{title}</p>
      <p className="font-sans text-base text-ink-soft">{children}</p>
    </div>
  );
}

export default async function MentorshipPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz');

  const [mentors, mentorships] = await Promise.all([getMentors(), getMyMentorships()]);
  const requestedMentorIds = new Set(mentorships.map((m) => m.mentor_id));

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
          >
            <UsersIcon width={22} height={22} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Mentorlik</h1>
            <p className="mt-1 font-sans text-base text-ink-soft">
              Tajribali ustozlardan mentorlik so'rang — davriy uchrashuvlar orqali martaba
              yo'lingizda yordam olasiz.
            </p>
          </div>
        </div>

        <GlassCard className="mt-8 p-6">
          <CardHeader>
            <CardTitle>Mentorliklarim</CardTitle>
            <CardDescription>So'ragan yoki qabul qilgan mentorliklaringiz shu yerda.</CardDescription>
          </CardHeader>

          {mentorships.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {mentorships.map((m) => {
                const isMentor = m.mentor_id === me.id;
                const counterpart = isMentor ? m.mentee_name : m.mentor_name;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/ustoz/${m.id}`}
                      className="flex min-h-touch items-center justify-between gap-3 rounded border border-line px-3 py-2 transition-colors hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      <span className="flex items-center gap-3">
                        <InitialAvatar name={counterpart} />
                        <span className="flex flex-col">
                          <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                            {isMentor ? 'Shogird' : 'Ustoz'}
                          </span>
                          <span className="font-sans text-base font-medium text-ink">{counterpart}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[m.status] ?? 'neutral'}>
                          {STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                        <ChevronRightIcon className="text-ink-soft" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState Icon={RouteIcon} title="Hali mentorlik yo'q">
              Pastdagi ustozlar ro'yxatidan birini tanlab, mentorlik so'rang.
            </EmptyState>
          )}
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Ustozlar</CardTitle>
            <CardDescription>Mentorlik so'rash uchun ustozni tanlang.</CardDescription>
          </CardHeader>

          {mentors.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {mentors.map((mentor) => {
                const isSelf = mentor.id === me.id;
                const alreadyRequested = requestedMentorIds.has(mentor.id);
                return (
                  <li
                    key={mentor.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-line px-3 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <InitialAvatar name={mentor.full_name} />
                      <span className="flex flex-col">
                        <span className="font-sans text-base font-medium text-ink">
                          {mentor.full_name}
                        </span>
                        <span className="font-mono text-xs text-ink-soft">@{mentor.username}</span>
                      </span>
                    </span>
                    {isSelf ? (
                      <Badge variant="neutral">Siz</Badge>
                    ) : alreadyRequested ? (
                      <Badge variant="info">So'rov yuborilgan</Badge>
                    ) : (
                      <RequestMentorshipButton mentorId={mentor.id} />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState Icon={UsersIcon} title="Hozircha ustoz yo'q">
              Tez orada tajribali mutaxassislar shu yerga qo'shiladi.
            </EmptyState>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
