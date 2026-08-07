import { ChartIcon } from '@/components/shell-icons';
import type { BucketStat } from '@/lib/types';

/** Hudud/toifa taqsimoti — oddiy gorizontal ustunlar (tashqi kutubxonasiz). */
export function StatBarList({ items }: { items: BucketStat[] }) {
  if (items.length === 0) {
    return (
      <div className="imk-empty">
        <span className="imk-empty__icon" aria-hidden="true">
          <ChartIcon width={22} height={22} />
        </span>
        <p className="font-sans text-base text-ink-soft">Hozircha ko&apos;rsatiladigan ma&apos;lumot yo&apos;q.</p>
      </div>
    );
  }
  const max = Math.max(1, ...items.map((i) => i.count ?? 0));

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate font-sans text-sm text-ink-soft">
            {item.label}
          </span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-mint" role="presentation">
            {item.count !== null && (
              <span
                className="block h-full rounded-full bg-bright"
                style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
              />
            )}
          </span>
          <span className="w-36 shrink-0 truncate text-right font-mono text-xs text-ink" title={item.count === null ? "ko'rsatilmaydi (<3)" : String(item.count)}>
            {item.count === null ? "ko'rsatilmaydi" : item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
