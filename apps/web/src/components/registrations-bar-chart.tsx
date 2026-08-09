import { cn } from '@imkon/ui';
import type { DailyBucket } from '@/lib/types';
import { ChartIcon } from '@/components/shell-icons';
import { QueueEmpty } from '@/components/admin-queue-states';

const WEEKDAY_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

function weekdayLabel(iso: string): string {
  const parts = iso.split('-').map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return WEEKDAY_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
}

export function RegistrationsBarChart({
  days,
  title = "Ro'yxatdan o'tish · 7 kun",
}: {
  days: DailyBucket[];
  title?: string;
}) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const dailyAvg = days.length > 0 ? Math.round(total / days.length) : 0;

  if (days.length === 0) {
    return (
      <QueueEmpty
        Icon={ChartIcon}
        title="Grafik hali yo'q"
        message="Ro'yxatdan o'tish ma'lumoti yuklanmadi yoki so'nggi 7 kunda hech kim ro'yxatdan o'tmagan."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-base font-bold text-ink">{title}</span>
        <span className="font-sans text-sm text-ink-soft">Kunlik o&apos;rtacha {dailyAvg}</span>
      </div>
      <div className="flex h-[150px] items-end gap-2.5" role="img" aria-label={`Oxirgi 7 kunda ${total} ta ro'yxatdan o'tish`}>
        {days.map((d, i) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count}`}
            className={cn(
              'flex-1 rounded-t-lg rounded-b-sm',
              i === days.length - 1 ? 'bg-bright' : 'bg-bright/30',
            )}
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-sans text-xs text-ink-soft">
        {days.map((d) => (
          <span key={d.date}>{weekdayLabel(d.date)}</span>
        ))}
      </div>
    </div>
  );
}
