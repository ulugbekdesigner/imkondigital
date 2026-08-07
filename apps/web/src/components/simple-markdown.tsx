import type { ReactNode } from 'react';

/** `**qalin**` bo'laklarini <strong> qilib ajratadi — boshqa hech narsa parse qilinmaydi. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

/**
 * AI javoblarida (Career Coach, CV Builder) va'da qilingan minimal Markdown
 * to'plamini (##/# sarlavha, -/* band, 1. raqamlangan, **qalin**) React
 * elementlariga aylantiradi — to'liq CommonMark kutubxonasiz, dangerouslySetInnerHTML'siz.
 */
export function SimpleMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let numberBuffer: string[] = [];

  function flush(key: string) {
    if (bulletBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} className="list-disc space-y-1 pl-5">
          {bulletBuffer.map((item, i) => (
            <li key={i}>{renderInline(item, `ul-${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      bulletBuffer = [];
    }
    if (numberBuffer.length > 0) {
      blocks.push(
        <ol key={`ol-${key}`} className="list-decimal space-y-1 pl-5">
          {numberBuffer.map((item, i) => (
            <li key={i}>{renderInline(item, `ol-${key}-${i}`)}</li>
          ))}
        </ol>,
      );
      numberBuffer = [];
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)/);
    if (trimmed.startsWith('## ')) {
      flush(String(i));
      blocks.push(
        <h3 key={i} className="font-display text-base font-bold">
          {trimmed.slice(3)}
        </h3>,
      );
    } else if (trimmed.startsWith('# ')) {
      flush(String(i));
      blocks.push(
        <h2 key={i} className="font-display text-lg font-bold">
          {trimmed.slice(2)}
        </h2>,
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bulletBuffer.push(trimmed.slice(2));
    } else if (numbered?.[1] !== undefined) {
      numberBuffer.push(numbered[1]);
    } else if (/^(---|\*\*\*)+$/.test(trimmed)) {
      flush(String(i));
      blocks.push(<hr key={i} className="border-current opacity-20" />);
    } else if (trimmed === '') {
      flush(String(i));
    } else {
      flush(String(i));
      blocks.push(
        <p key={i} className="whitespace-pre-wrap">
          {renderInline(trimmed, `p-${i}`)}
        </p>,
      );
    }
  });
  flush('end');

  return <div className={className}>{blocks}</div>;
}
