import { Badge, Button } from '@imkon/ui';
import type { PortfolioItem } from '@/lib/types';

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

export function PortfolioCard({
  item,
  onDelete,
  tone = 'paper',
}: {
  item: PortfolioItem;
  onDelete?: (id: number) => void;
  /** 'onlight' — ochiq passport (/u/[username]) Robot Aurora uslubi. */
  tone?: 'paper' | 'onlight';
}) {
  const image = item.media_urls.find((u) => IMAGE_RE.test(u));
  const onlight = tone === 'onlight';

  const titleClass = onlight ? 'text-base font-semibold' : 'font-display text-base font-semibold text-ink';
  const titleStyle = onlight ? { color: 'var(--land-text-on-light)' } : undefined;
  const bodyClass = onlight ? 'font-sans text-base' : 'font-sans text-base text-ink-soft';
  const bodyStyle = onlight ? { color: 'var(--land-text-on-light-muted)' } : undefined;
  const valueClass = onlight ? 'font-sans text-base' : 'font-sans text-base text-ink';
  const valueStyle = onlight ? { color: 'var(--land-text-on-light)' } : undefined;
  const eyebrowClass = onlight
    ? 'font-sans text-xs font-semibold uppercase tracking-wide'
    : 'font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft';
  const eyebrowStyle = onlight ? { color: 'var(--land-text-on-light-dim)' } : undefined;

  return (
    <li
      className={
        onlight
          ? 'imk-card imk-card--onlight overflow-hidden !p-0'
          : 'flex flex-col overflow-hidden rounded-lg border border-line bg-paper'
      }
    >
      {image && (
        // Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi
        <img src={image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className={titleClass} style={titleStyle}>
            {item.title}
          </h3>
          {item.source_type === 'submission' && <Badge>Kurs topshirig'i</Badge>}
        </div>
        {item.description && (
          <p className={bodyClass} style={bodyStyle}>
            {item.description}
          </p>
        )}

        {item.task && (
          <div>
            <p className={eyebrowClass} style={eyebrowStyle}>
              Vazifa
            </p>
            <p className={valueClass} style={valueStyle}>
              {item.task}
            </p>
          </div>
        )}

        {item.steps.length > 0 && (
          <div>
            <p className={eyebrowClass} style={eyebrowStyle}>
              Jarayon
            </p>
            <ol className="mt-1 flex flex-col gap-2">
              {item.steps.map((step) => (
                <li key={step.id} className="flex items-center gap-2">
                  {IMAGE_RE.test(step.media_url) && (
                    <img
                      src={step.media_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <span
                    className={onlight ? 'font-sans text-sm' : 'font-sans text-sm text-ink-soft'}
                    style={onlight ? { color: 'var(--land-text-on-light-muted)' } : undefined}
                  >
                    {step.caption}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {item.result && (
          <div>
            <p className={eyebrowClass} style={eyebrowStyle}>
              Natija
            </p>
            <p className={valueClass} style={valueStyle}>
              {item.result}
            </p>
          </div>
        )}

        {item.client_feedback && (
          <blockquote
            className={
              onlight
                ? 'rounded p-2 font-sans text-sm italic'
                : 'rounded border-l-2 border-primary bg-mint/40 p-2 font-sans text-sm italic text-ink'
            }
            style={
              onlight
                ? {
                    borderLeft: '2px solid var(--land-brand-500)',
                    background: 'var(--land-brand-100)',
                    color: 'var(--land-text-on-light)',
                  }
                : undefined
            }
          >
            "{item.client_feedback}"
          </blockquote>
        )}

        {item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.skills.map((skill) => (
              <Badge key={skill} variant="neutral">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {item.media_urls
          .filter((u) => u !== image)
          .map((u) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className={
                onlight
                  ? 'inline-flex min-h-touch items-center rounded font-sans text-base underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'
                  : 'inline-flex min-h-touch items-center rounded font-sans text-base text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'
              }
              style={onlight ? { color: 'var(--land-brand-600)' } : undefined}
            >
              Faylni ko'rish
            </a>
          ))}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 self-start text-error hover:bg-error/10"
            onClick={() => onDelete(item.id)}
          >
            O'chirish
          </Button>
        )}
      </div>
    </li>
  );
}
