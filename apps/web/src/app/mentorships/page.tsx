import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants, cn } from '@imkon/ui';
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

/** Avatar rasmi bo'lmagani uchun ism bosh harfidan fallback belgi. */
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

export default async function MentorshipsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/mentorships');

  const [mentors, mentorships] = await Promise.all([getMentors(), getMyMentorships()]);
  const requestedMentorIds = new Set(mentorships.map((m) => m.mentor_id));

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary"
          >
            <UsersIcon width={20} height={20} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Qo'llab-quvvatlash</p>
            <h1 className="font-display text-2xl font-bold text-ink">Mentorlik</h1>
          </div>
        </div>
        <p className="mt-4 font-sans text-base text-ink-soft">
          Tajribali ustozlardan mentorlik so'rang — davriy uchrashuvlar va check-inlar orqali
          martaba yo'lingizda yordam olasiz.
        </p>

        <section className="mt-8" aria-labelledby="mentorships-mine-heading">
          <h2 id="mentorships-mine-heading" className="font-display text-lg font-bold text-ink">
            Mentorliklarim
          </h2>
          <p className="mt-1 font-sans text-sm text-ink-soft">
            So'ragan yoki qabul qilgan mentorliklaringiz shu yerda.
          </p>

          {mentorships.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {mentorships.map((m) => {
                const isMentor = m.mentor_id === me.id;
                const counterpart = isMentor ? m.mentee_name : m.mentor_name;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/mentorships/${m.id}`}
                      className="flex min-h-touch items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <InitialAvatar name={counterpart} />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                            {isMentor ? 'Shogird' : 'Ustoz'}
                          </span>
                          <span className="truncate font-sans text-base font-medium text-ink">
                            {counterpart}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[m.status] ?? 'neutral'}>
                          {STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                        <ChevronRightIcon
                          width={18}
                          height={18}
                          className="text-ink-soft transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="imk-empty mt-4 items-center text-center">
              <span className="imk-empty__icon mx-auto">
                <RouteIcon width={22} height={22} aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-bold text-ink">Hali mentorlik yo'q</h3>
              <p className="mx-auto max-w-xl font-sans text-base text-ink-soft">
                Pastdagi ustozlar ro'yxatidan birini tanlab, mentorlik so'rang.
              </p>
              <a
                href="#mentorships-mentors-heading"
                className={cn(buttonVariants({ size: 'md' }), 'mx-auto')}
              >
                Ustozlarni ko'rish
              </a>
            </div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="mentorships-mentors-heading">
          <h2 id="mentorships-mentors-heading" className="font-display text-lg font-bold text-ink">
            Ustozlar
          </h2>
          <p className="mt-1 font-sans text-sm text-ink-soft">
            Mentorlik so'rash uchun ustozni tanlang.
          </p>

          {mentors.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {mentors.map((mentor) => {
                const isSelf = mentor.id === me.id;
                const alreadyRequested = requestedMentorIds.has(mentor.id);
                return (
                  <li
                    key={mentor.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <InitialAvatar name={mentor.full_name} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-sans text-base font-medium text-ink">
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
            <div className="imk-empty mt-4 items-center text-center">
              <span className="imk-empty__icon mx-auto">
                <UsersIcon width={22} height={22} aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-bold text-ink">Hozircha ustoz yo'q</h3>
              <p className="mx-auto max-w-xl font-sans text-base text-ink-soft">
                Tez orada tajribali mutaxassislar shu yerga qo'shiladi — birozdan so'ng qayta
                kiring.
              </p>
              <Link
                href="/kurslar"
                className={cn(buttonVariants({ size: 'md' }), 'mx-auto')}
              >
                Kurslarni ko'rish
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
