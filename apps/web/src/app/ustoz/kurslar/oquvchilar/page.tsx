import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, ProgressBar } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getInstructorStudents } from '@/lib/instructor-studio-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { UsersIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: "O'quvchilarim — Ustoz kabineti",
  robots: { index: false },
};

export default async function InstructorStudentsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/oquvchilar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="max-w-3xl">
        <CabinetPageHeader title="O'quvchilarim" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const students = await getInstructorStudents();
  const stuckCount = students.filter((s) => s.is_stuck).length;
  const subtitle =
    students.length > 0
      ? `Barcha kurslaringiz bo'yicha ${students.length} o'quvchi${
          stuckCount > 0 ? `, shundan ${stuckCount} tasi 14+ kun faolsiz` : ''
        }.`
      : undefined;

  return (
    <div className="max-w-3xl">
      <CabinetPageHeader title="O'quvchilarim" subtitle={subtitle} />

      {students.length > 0 ? (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {students.map((s) => (
            <li
              key={`${s.course_id}-${s.user_id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-line px-4"
              style={{ minHeight: 'var(--h-table-row)' }}
            >
              <div>
                <p className="t-body font-medium text-ink">{s.full_name}</p>
                <p className="t-caption text-ink-soft">{s.course_title}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.is_stuck && <Badge variant="warn">Qotib qolgan</Badge>}
                <div className="flex w-32 items-center gap-2">
                  <ProgressBar
                    value={s.progress_pct}
                    label={`${s.full_name} — kurs progressi`}
                    className="flex-1"
                  />
                  <span className="t-num text-ink-soft" style={{ fontSize: 'var(--fs-body-sm)' }}>
                    {s.progress_pct}%
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="imk-empty">
          <span className="imk-empty__icon" aria-hidden="true">
            <UsersIcon width={26} height={26} />
          </span>
          <p className="font-sans text-base font-medium text-ink">Hali o'quvchi yo'q</p>
          <p className="max-w-sm font-sans text-sm text-ink-soft">
            Hali hech kim kurslaringizga yozilmagan.
          </p>
        </div>
      )}
    </div>
  );
}
