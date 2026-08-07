import { Card, CardContent } from '@imkon/ui';
import type { CourseStatsOut } from '@/lib/types';

export function CourseStatsCard({ stats }: { stats: CourseStatsOut }) {
  const items = [
    { label: "Ko'rishlar", value: stats.views_count },
    { label: "O'quvchilar", value: stats.students_count },
    { label: 'Tugatish darajasi', value: `${stats.completion_rate_pct}%` },
    { label: 'O\'rtacha reyting', value: `${stats.average_rating.toFixed(1)} (${stats.review_count})` },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="font-mono text-xl font-bold text-ink">{item.value}</p>
            <p className="mt-1 font-sans text-xs text-ink-soft">{item.label}</p>
          </div>
        ))}
      </CardContent>
      {stats.most_dropped_lesson_title && (
        <div className="border-t border-line p-4">
          <p className="font-sans text-sm text-ink-soft">
            Eng ko'p tashlab ketiladigan dars:{' '}
            <span className="font-medium text-ink">{stats.most_dropped_lesson_title}</span>
            {stats.most_dropped_lesson_pct !== null && (
              <> — o'quvchilarning {stats.most_dropped_lesson_pct}% shu darsda to'xtagan</>
            )}
          </p>
        </div>
      )}
      {!stats.income_available && (
        <div className="border-t border-line p-4">
          <p className="font-sans text-xs text-ink-soft">
            Daromad statistikasi hali mavjud emas — pullik kurslar uchun to'lov tizimi
            ulanmagan.
          </p>
        </div>
      )}
    </Card>
  );
}
