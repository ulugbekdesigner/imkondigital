import Link from 'next/link';
import { cn } from '@imkon/ui';

const OPTIONS: { value: 'davlat' | 'kompaniya' | undefined; label: string }[] = [
  { value: undefined, label: 'Hammasi' },
  { value: 'davlat', label: 'Davlat' },
  { value: 'kompaniya', label: 'Kompaniya' },
];

export function BenefitProviderFilter({ active }: { active: string | undefined }) {
  return (
    <nav aria-label="Kim taqdim etishi bo'yicha filtr">
      <div className="inline-flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const isActive = opt.value === active;
          const href = opt.value ? `/imtiyozlar?provider_type=${opt.value}` : '/imtiyozlar';
          return (
            <Link
              key={opt.label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'imk-chip imk-chip--onlight flex min-h-touch items-center',
                isActive && 'imk-chip--active',
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
